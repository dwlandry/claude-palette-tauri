use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::State;

// Types matching the TypeScript frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ResourceType {
    Agent,
    Command,
    Skill,
    Hook,
    Plan,
    Plugin,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ResourceScope {
    Project,
    Global,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resource {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub resource_type: ResourceType,
    pub path: String,
    pub description: Option<String>,
    pub source: String,
    #[serde(rename = "pluginName")]
    pub plugin_name: Option<String>,
    pub scope: ResourceScope,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceGroup {
    #[serde(rename = "type")]
    pub group_type: ResourceType,
    pub label: String,
    pub resources: Vec<Resource>,
    pub collapsed: bool,
}

// App state to hold the project path
pub struct AppState {
    pub project_path: Mutex<Option<String>>,
}

fn get_claude_dir() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".claude"))
}

fn extract_description(content: &str) -> Option<String> {
    let mut in_frontmatter = false;

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed == "---" {
            in_frontmatter = !in_frontmatter;
            continue;
        }
        if in_frontmatter {
            continue;
        }
        if trimmed.starts_with('#') {
            continue;
        }
        if !trimmed.is_empty() {
            let desc = if trimmed.len() > 100 {
                format!("{}...", &trimmed[..100])
            } else {
                trimmed.to_string()
            };
            return Some(desc);
        }
    }
    None
}

fn scan_directory(
    dir: &Path,
    resource_type: ResourceType,
    source: &str,
    plugin_name: Option<&str>,
    scope: ResourceScope,
    prefix: &str,
) -> Vec<Resource> {
    let mut resources = Vec::new();

    if !dir.exists() {
        return resources;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            let file_name = entry.file_name().to_string_lossy().to_string();

            if path.is_file() && file_name.ends_with(".md") {
                let name = file_name.trim_end_matches(".md").to_string();
                let full_name = if prefix.is_empty() {
                    name.clone()
                } else {
                    format!("{}/{}", prefix, name)
                };

                let description = fs::read_to_string(&path)
                    .ok()
                    .and_then(|content| extract_description(&content));

                let type_str = match resource_type {
                    ResourceType::Agent => "agent",
                    ResourceType::Command => "command",
                    ResourceType::Skill => "skill",
                    ResourceType::Hook => "hook",
                    ResourceType::Plan => "plan",
                    ResourceType::Plugin => "plugin",
                };

                let scope_str = match scope {
                    ResourceScope::Project => "project",
                    ResourceScope::Global => "global",
                };

                let id = format!(
                    "{}-{}-{}-{}-{}",
                    type_str,
                    source,
                    scope_str,
                    plugin_name.unwrap_or("user"),
                    full_name
                );

                resources.push(Resource {
                    id,
                    name: full_name,
                    resource_type: resource_type.clone(),
                    path: path.to_string_lossy().to_string(),
                    description,
                    source: source.to_string(),
                    plugin_name: plugin_name.map(|s| s.to_string()),
                    scope: scope.clone(),
                });
            } else if path.is_dir() && matches!(resource_type, ResourceType::Command) {
                // Handle nested command directories (e.g., consider/, research/)
                let nested_prefix = if prefix.is_empty() {
                    file_name.clone()
                } else {
                    format!("{}/{}", prefix, file_name)
                };
                let nested = scan_directory(
                    &path,
                    resource_type.clone(),
                    source,
                    plugin_name,
                    scope.clone(),
                    &nested_prefix,
                );
                resources.extend(nested);
            }
        }
    }

    resources
}

fn scan_plugins() -> Vec<Resource> {
    let mut resources = Vec::new();

    let Some(claude_dir) = get_claude_dir() else {
        return resources;
    };

    let marketplaces_dir = claude_dir.join("plugins").join("marketplaces");
    if !marketplaces_dir.exists() {
        return resources;
    }

    if let Ok(marketplaces) = fs::read_dir(&marketplaces_dir) {
        for marketplace in marketplaces.flatten() {
            if !marketplace.path().is_dir() {
                continue;
            }

            let marketplace_name = marketplace.file_name().to_string_lossy().to_string();
            let plugin_dir = marketplace.path();

            // Scan agents
            resources.extend(scan_directory(
                &plugin_dir.join("agents"),
                ResourceType::Agent,
                "plugin",
                Some(&marketplace_name),
                ResourceScope::Global,
                "",
            ));

            // Scan commands
            resources.extend(scan_directory(
                &plugin_dir.join("commands"),
                ResourceType::Command,
                "plugin",
                Some(&marketplace_name),
                ResourceScope::Global,
                "",
            ));

            // Scan skills
            let skills_dir = plugin_dir.join("skills");
            if skills_dir.exists() {
                if let Ok(skills) = fs::read_dir(&skills_dir) {
                    for skill in skills.flatten() {
                        if skill.path().is_dir() {
                            let skill_path = skill.path().join("SKILL.md");
                            if skill_path.exists() {
                                let skill_name = skill.file_name().to_string_lossy().to_string();
                                let description = fs::read_to_string(&skill_path)
                                    .ok()
                                    .and_then(|content| extract_description(&content));

                                resources.push(Resource {
                                    id: format!("skill-plugin-global-{}", skill_name),
                                    name: skill_name,
                                    resource_type: ResourceType::Skill,
                                    path: skill_path.to_string_lossy().to_string(),
                                    description,
                                    source: "plugin".to_string(),
                                    plugin_name: Some(marketplace_name.clone()),
                                    scope: ResourceScope::Global,
                                });
                            }
                        }
                    }
                }
            }

            // Also check plugins subfolder
            let plugins_sub_dir = plugin_dir.join("plugins");
            if plugins_sub_dir.exists() {
                if let Ok(plugins) = fs::read_dir(&plugins_sub_dir) {
                    for plugin in plugins.flatten() {
                        if !plugin.path().is_dir() {
                            continue;
                        }

                        let plugin_name = plugin.file_name().to_string_lossy().to_string();
                        let p_dir = plugin.path();

                        resources.extend(scan_directory(
                            &p_dir.join("agents"),
                            ResourceType::Agent,
                            "plugin",
                            Some(&plugin_name),
                            ResourceScope::Global,
                            "",
                        ));

                        resources.extend(scan_directory(
                            &p_dir.join("commands"),
                            ResourceType::Command,
                            "plugin",
                            Some(&plugin_name),
                            ResourceScope::Global,
                            "",
                        ));
                    }
                }
            }
        }
    }

    resources
}

fn scan_project_resources(project_path: &str) -> Vec<Resource> {
    let mut resources = Vec::new();
    let project_dir = Path::new(project_path);
    let project_claude_dir = project_dir.join(".claude");

    // Scan CLAUDE.md
    let claude_md_path = project_dir.join("CLAUDE.md");
    if claude_md_path.exists() {
        let description = fs::read_to_string(&claude_md_path)
            .ok()
            .and_then(|content| extract_description(&content));

        resources.push(Resource {
            id: "project-claude-md".to_string(),
            name: "CLAUDE.md".to_string(),
            resource_type: ResourceType::Plan,
            path: claude_md_path.to_string_lossy().to_string(),
            description,
            source: "user".to_string(),
            plugin_name: None,
            scope: ResourceScope::Project,
        });
    }

    if !project_claude_dir.exists() {
        return resources;
    }

    // Scan project agents
    resources.extend(scan_directory(
        &project_claude_dir.join("agents"),
        ResourceType::Agent,
        "user",
        None,
        ResourceScope::Project,
        "",
    ));

    // Scan project commands
    resources.extend(scan_directory(
        &project_claude_dir.join("commands"),
        ResourceType::Command,
        "user",
        None,
        ResourceScope::Project,
        "",
    ));

    // Scan project plans
    resources.extend(scan_directory(
        &project_claude_dir.join("plans"),
        ResourceType::Plan,
        "user",
        None,
        ResourceScope::Project,
        "",
    ));

    resources
}

fn scan_claude_resources(project_path: Option<&str>) -> Vec<ResourceGroup> {
    let mut groups = Vec::new();

    // Project resources first
    let project_resources = project_path
        .map(|p| scan_project_resources(p))
        .unwrap_or_default();

    if !project_resources.is_empty() {
        groups.push(ResourceGroup {
            group_type: ResourceType::Plan,
            label: "Project".to_string(),
            resources: project_resources,
            collapsed: false,
        });
    }

    // Global user resources
    let claude_dir = get_claude_dir();

    let user_agents = claude_dir
        .as_ref()
        .map(|d| scan_directory(&d.join("agents"), ResourceType::Agent, "user", None, ResourceScope::Global, ""))
        .unwrap_or_default();

    let user_commands = claude_dir
        .as_ref()
        .map(|d| scan_directory(&d.join("commands"), ResourceType::Command, "user", None, ResourceScope::Global, ""))
        .unwrap_or_default();

    let user_plans = claude_dir
        .as_ref()
        .map(|d| scan_directory(&d.join("plans"), ResourceType::Plan, "user", None, ResourceScope::Global, ""))
        .unwrap_or_default();

    // Plugin resources
    let plugin_resources = scan_plugins();

    // Group by type
    let mut all_agents: Vec<Resource> = user_agents;
    let mut all_commands: Vec<Resource> = user_commands;
    let mut all_skills: Vec<Resource> = Vec::new();

    for r in plugin_resources {
        match r.resource_type {
            ResourceType::Agent => all_agents.push(r),
            ResourceType::Command => all_commands.push(r),
            ResourceType::Skill => all_skills.push(r),
            _ => {}
        }
    }

    if !all_agents.is_empty() {
        groups.push(ResourceGroup {
            group_type: ResourceType::Agent,
            label: "Agents".to_string(),
            resources: all_agents,
            collapsed: false,
        });
    }

    if !all_commands.is_empty() {
        groups.push(ResourceGroup {
            group_type: ResourceType::Command,
            label: "Commands".to_string(),
            resources: all_commands,
            collapsed: false,
        });
    }

    if !all_skills.is_empty() {
        groups.push(ResourceGroup {
            group_type: ResourceType::Skill,
            label: "Skills".to_string(),
            resources: all_skills,
            collapsed: false,
        });
    }

    if !user_plans.is_empty() {
        groups.push(ResourceGroup {
            group_type: ResourceType::Plan,
            label: "Plans".to_string(),
            resources: user_plans,
            collapsed: true,
        });
    }

    groups
}

#[tauri::command]
fn get_resources(state: State<AppState>) -> Vec<ResourceGroup> {
    let project_path = state.project_path.lock().unwrap();
    scan_claude_resources(project_path.as_deref())
}

#[tauri::command]
fn get_project_path(state: State<AppState>) -> Option<String> {
    state.project_path.lock().unwrap().clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Parse command line args for project path
    let args: Vec<String> = std::env::args().collect();
    let project_path = args
        .iter()
        .skip(1)
        .find(|arg| !arg.starts_with('-') && !arg.starts_with("--"))
        .map(|p| {
            std::path::Path::new(p)
                .canonicalize()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|_| p.clone())
        });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(AppState {
            project_path: Mutex::new(project_path),
        })
        .invoke_handler(tauri::generate_handler![get_resources, get_project_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
