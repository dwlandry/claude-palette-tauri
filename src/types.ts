export type ResourceType = 'agent' | 'command' | 'skill' | 'hook' | 'plan' | 'plugin'
export type ResourceScope = 'project' | 'global'

export interface Resource {
  id: string
  name: string
  type: ResourceType
  path: string
  description?: string
  source: 'user' | 'plugin'
  pluginName?: string
  scope: ResourceScope
}

export interface ResourceGroup {
  type: ResourceType
  label: string
  resources: Resource[]
  collapsed: boolean
}

export interface AppState {
  groups: ResourceGroup[]
  alwaysOnTop: boolean
  filter: string
}
