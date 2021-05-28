import { getRenderingEngine } from '@ohif/cornerstone-render'
import { state } from '../index'
import IToolGroup from './IToolGroup'
import ISetToolModeOptions from './ISetToolModeOptions'
import ToolModes from '../../enums/ToolModes'
import deepmerge from '../../util/deepMerge'

const { Active, Passive, Enabled, Disabled } = ToolModes

function createToolGroup(toolGroupId: string): IToolGroup | undefined {
  // Exit early if ID conflict
  const toolGroupWithIdExists = state.toolGroups.some(
    (tg) => tg.id === toolGroupId
  )

  if (toolGroupWithIdExists) {
    console.warn(`'${toolGroupId}' already exists.`)
    return
  }

  // Create
  const toolGroup: IToolGroup = {
    _tools: {},
    id: toolGroupId,
    viewports: [],
    tools: {},
    //
    getToolInstance: function (toolName) {
      const toolInstance = this._tools[toolName]
      if (!toolInstance) {
        console.warn(`'${toolName}' is not registered with this toolGroup.`)
        return
      }
      return toolInstance
    },
    addTool: function (toolName, toolConfiguration = {}) {
      const toolDefinition = state.tools[toolName]
      const hasToolName = typeof toolName !== 'undefined' && toolName !== ''
      const localToolInstance = this.tools[toolName]

      if (!hasToolName) {
        console.warn(
          'Tool with configuration did not produce a toolName: ',
          toolConfiguration
        )
        return
      }

      if (!toolDefinition) {
        console.warn(`'${toolName}' is not registered with the library.`)
        return
      }

      if (localToolInstance) {
        console.warn(`'${toolName}' is already registered for this ToolGroup.`)
        return
      }

      // Should these be renamed higher up, so we don't have to alias?
      // Wrap in try-catch so 3rd party tools don't explode?
      const { toolClass: ToolClass, toolOptions: defaultToolOptions } =
        toolDefinition

      const mergedToolConfiguration = deepmerge(
        defaultToolOptions,
        toolConfiguration
      )

      const instantiatedTool = new ToolClass(mergedToolConfiguration)

      // API instead of directly exposing schema?
      // Maybe not here, but feels like a "must" for any method outside of the ToolGroup itself
      this._tools[toolName] = instantiatedTool
    },
    addViewports: function (
      renderingEngineUID: string,
      sceneUID?: string,
      viewportUID?: string
    ): void {
      this.viewports.push({ renderingEngineUID, sceneUID, viewportUID })
    },
    /**
     * Removes viewport from the toolGroup. If only renderingEngineUID is defined
     * it removes all the viewports with the same renderingEngineUID, if more filters
     * are provided, it uses them to search the viewport.
     * @param renderingEngineUID renderingEngine uid
     * @param sceneUID scene uid
     * @param viewportUID viewport uid
     */
    removeViewports: function (
      renderingEngineUID: string,
      sceneUID?: string,
      viewportUID?: string
    ): void {
      const indices = []

      this.viewports.forEach((vp, index) => {
        let match = false
        if (vp.renderingEngineUID === renderingEngineUID) {
          match = true

          if (sceneUID && vp.sceneUID !== sceneUID) {
            match = false
          }

          if (viewportUID && vp.viewportUID !== viewportUID) {
            match = false
          }
        }
        if (match) {
          indices.push(index)
        }
      })

      if (indices.length) {
        // going in reverse to not mess up the indexes to be removed
        for (let i = indices.length - 1; i >= 0; i--) {
          this.viewports.splice(indices[i], 1)
        }
      }
    },
    // ~ setToolMode
    setToolActive: function (
      toolName: string,
      toolModeOptions: ISetToolModeOptions
    ): void {
      if (this._tools[toolName] === undefined) {
        console.warn(
          `Tool ${toolName} not added to toolgroup, can't set tool mode.`
        )

        return
      }

      // Would only need this for sanity check if not instantiating/hydrating
      // const tool = this.tools[toolName];
      const toolModeOptionsWithMode = Object.assign(
        {
          bindings: [],
        },
        toolModeOptions,
        {
          mode: Active,
        }
      )

      this.tools[toolName] = toolModeOptionsWithMode
      this._tools[toolName].mode = Active
      this.refreshViewports()
    },
    setToolPassive: function (
      toolName: string,
      toolModeOptions: ISetToolModeOptions
    ): void {
      if (this._tools[toolName] === undefined) {
        console.warn(
          `Tool ${toolName} not added to toolgroup, can't set tool mode.`
        )

        return
      }

      // Would only need this for sanity check if not instantiating/hydrating
      // const tool = this.tools[toolName];
      const toolModeOptionsWithMode = Object.assign(
        {
          bindings: [],
        },
        toolModeOptions,
        {
          mode: Passive,
        }
      )

      this.tools[toolName] = toolModeOptionsWithMode
      this._tools[toolName].mode = Passive
      this.refreshViewports()
    },
    setToolEnabled: function (
      toolName: string,
      toolModeOptions: ISetToolModeOptions
    ): void {
      if (this._tools[toolName] === undefined) {
        console.warn(
          `Tool ${toolName} not added to toolgroup, can't set tool mode.`
        )

        return
      }

      // Would only need this for sanity check if not instantiating/hydrating
      // const tool = this.tools[toolName];
      const toolModeOptionsWithMode = Object.assign(
        {
          bindings: [],
        },
        toolModeOptions,
        {
          mode: Enabled,
        }
      )

      this.tools[toolName] = toolModeOptionsWithMode
      this._tools[toolName].mode = Enabled
      this.refreshViewports()
    },
    setToolDisabled: function (
      toolName: string,
      toolModeOptions: ISetToolModeOptions
    ): void {
      if (this._tools[toolName] === undefined) {
        console.warn(
          `Tool ${toolName} not added to toolgroup, can't set tool mode.`
        )

        return
      }

      // Would only need this for sanity check if not instantiating/hydrating
      // const tool = this.tools[toolName];
      const toolModeOptionsWithMode = Object.assign(
        {
          bindings: [],
        },
        toolModeOptions,
        {
          mode: Disabled,
        }
      )
      this.tools[toolName] = toolModeOptionsWithMode
      this._tools[toolName].mode = Disabled
      this.refreshViewports()
    },
    // We need to refresh related viewports when a tool mode is changed in order
    // to update the rendered measurements.
    refreshViewports(): void {
      this.viewports.forEach(({ renderingEngineUID, viewportUID }) => {
        getRenderingEngine(renderingEngineUID).renderViewport(viewportUID)
      })
    },
  }

  // Update state
  state.toolGroups.push(toolGroup)

  // Return reference
  return toolGroup
}

export default createToolGroup