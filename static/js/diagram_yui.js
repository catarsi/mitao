YUI().use(
  'aui-diagram-builder',
  function(Y) {

    var availableFields = [
      {
        iconClass: 'diagram-node-task-icon',
        label: 'Task',
        type: 'task'
      },
      {
        iconClass: 'diagram-fork-tool-icon',
        label: 'Fork',
        type: 'fork'
      }
    ];

    var diagramBuilder = new Y.DiagramBuilder (
      {
        availableFields: availableFields,
        boundingBox: '#diagram-builder-bb',
        srcNode: '#diagram-builder-sn',
        height: 500,
        fields: [
          {
            iconClass: 'diagram-node-tool-icon',
            label: 'Fork',
            type: 'fork',
            xy: [30, 30]
          },
          {
            name: 'StartNode',
            type: 'start',
            xy: [10, 10]
          },
          {
            name: 'EndNode',
            type: 'end',
            xy: [300, 400]
          }
        ],
        render: true
      }
    );

    diagramBuilder.connectAll(
      [
        {
          connector: {
            name: 'TaskConnector'
          },
          source: 'StartNode',
          target: 'EndNode'
        }
      ]
    );

    console.log(diagramBuilder);

  }
);
