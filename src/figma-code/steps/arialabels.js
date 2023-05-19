import { colors, figmaLayer, utils } from '../../constants';
import { createTransparentFrame } from '../../constants/figma-layer';
import config from '../config';
import { getOrCreateMainA11yFrame } from '../frame-helpers';

const arialabelLayerName = 'Arialabels Layer';
// TIPS for aria labels adapted from https://developer.mozilla.org/en-US/docs/Web/Accessibility

export const noArialabels = (msg) => {
  const { bounds, name, page, pageId, pageType } = msg;

  const mainPageNode = figma.getNodeById(pageId);

  // node not found
  if (mainPageNode === null) {
    // let the user know an error occurred
    figma.notify('Error occurred (no-arialabel::mainPageNodeNotFound)', {
      error: true,
      timeout: config.notifyTime
    });
    return;
  }

  // main data and setup
  const { height: pageH, width: pageW } = bounds;

  // top layer namings
  const saniName = utils.sanitizeName(name);

  // get main A11y frame if it exists (or create it)
  const { parent } = mainPageNode;
  const mainFrame = getOrCreateMainA11yFrame({ page, pageType });

  // check if aria label frame already exists
  const arialabelsFrame = utils.frameExistsOrCreate(
    mainFrame.id,
    arialabelLayerName,
    {
      height: pageH,
      width: pageW
    }
  );
  // update with id (for future scanning)
  arialabelsFrame.name = `${arialabelLayerName} | ${arialabelsFrame.id}`;

  // add within main Accessibility layer
  mainFrame.appendChild(arialabelsFrame);

  // grab main page a11y scan was for
  const ifExists = parent.children.filter((c) => c.name === saniName);
  const originalPage = ifExists[0];

  // update pagesData
  figma.ui.postMessage({
    type: 'update-pages-data',
    data: {
      status: 'add',
      stepKey: 'Arialabels',
      Arialabels: {
        id: arialabelsFrame.id
      },
      main: {
        id: mainFrame.id,
        name: saniName,
        pageId,
        page: {
          bounds,
          id: originalPage.id,
          mainPageId: pageId,
          name: saniName
        }
      }
    }
  });
};

export const add = (msg) => {
  const { bounds, arialabel, page, pageId, pageType } = msg;

  const mainPageNode = figma.getNodeById(pageId);

  // node not found
  if (mainPageNode === null) {
    // let the user know an error occurred
    figma.notify('Error occurred (add-arialabel::mainPageNodeNotFound)', {
      error: true,
      timeout: config.notifyTime
    });
    return;
  }

  // main data and setup
  const { height: pageH, width: pageW } = bounds;

  // get main A11y frame if it exists (or create it)
  const mainFrame = getOrCreateMainA11yFrame({ page, pageType });

  // check if aria label frame already exists
  const arialabelsFrame = utils.frameExistsOrCreate(
    mainFrame.id,
    arialabelLayerName,
    {
      height: pageH,
      width: pageW
    }
  );

  // update with id (for future scanning)
  arialabelsFrame.name = `${arialabelLayerName} | ${arialabelsFrame.id}`;

  // create aria label layer
  const arialabelBlock = createTransparentFrame({
    name: `Arialabel: ${arialabel}`,
    x: 0,
    y: 0,
    width: 300,
    height: 100
  });

  const arialabelBlockName = `Arialabel: ${arialabel} | ${arialabelBlock.id}`;
  arialabelBlock.name = arialabelBlockName;

  // Create rectangle / background
  const rectNode = figmaLayer.createRectangle({
    name: `Aria label Area: ${arialabel}`,
    height: 100,
    width: 300
  });

  rectNode.constraints = {
    horizontal: 'SCALE',
    vertical: 'SCALE'
  };
  rectNode.x = 0;
  rectNode.y = 0;

  // add rectangle within aria label layer
  arialabelBlock.appendChild(rectNode);

  // create annotation label
  const arialabelDisplay = utils.capitalize(arialabel).replace(/-/g, ' ');

  // Create label background with auto-layout
  const labelFrame = figmaLayer.createFrame({
    name: 'Label Background',
    height: 1,
    width: 1,
    x: 0,
    y: 0,
    opacity: 1
  });
  labelFrame.layoutMode = 'HORIZONTAL';
  labelFrame.horizontalPadding = 12;
  labelFrame.verticalPadding = 8;
  labelFrame.counterAxisSizingMode = 'AUTO';
  labelFrame.cornerRadius = 8;
  // Do NOT have it scale with the surrounding frame
  labelFrame.constraints = {
    horizontal: 'MIN',
    vertical: 'MIN'
  };

  // create annotation name for label
  const labelNode = figma.createText();
  labelNode.name = `Aria label Name: ${arialabelDisplay}`;
  labelNode.fontSize = 15;
  labelNode.characters = arialabelDisplay;
  labelNode.fills = [{ type: 'SOLID', color: colors.white }];
  labelNode.fontName = { family: 'Roboto', style: 'Bold' };

  // Add label node to frame
  labelFrame.appendChild(labelNode);

  // Add label frame to aria label block
  arialabelBlock.appendChild(labelFrame);

  // Add aria label block to greater aria label frame
  arialabelsFrame.appendChild(arialabelBlock);

  // de-selection of layer on Figma document
  figma.currentPage.selection = [];

  // add aria label frame within main Accessibility layer
  mainFrame.appendChild(arialabelsFrame);

  // set selection of new aria label layer
  figma.currentPage.selection = [arialabelBlock];

  // let the user know rectangle has been added
  figma.notify(`${arialabel} overlay added successfully!`, {
    timeout: config.notifyTime
  });

  // send message response back to plugin frontend (ui.js)
  figma.ui.postMessage({
    type: 'arialabel-confirmed',
    data: {
        arialabelId: arialabelBlock.id,
        arialabelType: arialabel,
        arialabelName: arialabelBlockName
    }
  });
};

export const completed = (msg) => {
  const { page, pageType } = msg;

  // main data and setup
  const { bounds, mainPageId, name } = page;

  // top layer namings
  const saniName = utils.sanitizeName(name);
  const pageTypeCap = utils.capitalize(pageType);
  const mainLayerName = `${saniName} ${config.a11ySuffix} | ${pageTypeCap}`;
  const arialabelsLayerName = 'Arialabels Layer';

  // does Accessibility layer exists already?
  const accessExists = utils.checkIfChildNameExists(mainPageId, mainLayerName);

  let mainFrame = null;

  // if Accessibility layer doesn't exist
  if (accessExists === null) {
    // let the user know an error occurred
    figma.notify('Error occurred (completed-arialabel::accessExists)', {
      error: true,
      timeout: config.notifyTime
    });
    return;
  }
  // already exists, grab by Node ID
  mainFrame = figma.getNodeById(accessExists);

  // check if aria label frame already exists
  const arialabelsExists = utils.checkIfChildNameExists(
    mainFrame.id,
    arialabelsLayerName
  );

  // if aria label layer doesn't exist
  if (arialabelsExists === null) {
    // let the user know an error occurred
    figma.notify('Error occurred (completed-arialabel::arialabelsExists)', {
      error: true,
      timeout: config.notifyTime
    });

    return;
  }

  // already exists, grab by Node ID
  const arialabelsFrame = figma.getNodeById(arialabelsExists);

  // grab main page a11y scan was for
  const { parent } = mainFrame;
  const [originalPage] = parent.children.filter((c) => c.name === saniName);

  // update pagesData
  figma.ui.postMessage({
    type: 'update-pages-data',
    data: {
      status: 'add',
      stepKey: 'Arialabels',
      Arialabels: {
        id: arialabelsFrame.id
      },
      main: {
        id: mainFrame.id,
        name: saniName,
        pageId: originalPage.id,
        page: {
          bounds,
          id: originalPage.id,
          mainPageId,
          name: saniName
        }
      }
    }
  });
};

export const updateWithLabel = (msg) => {
  const { id, value, arialabelType } = msg;

  // get aria label
  const arialabelNode = figma.getNodeById(id);

  // prevent memory leak (if not found, early return)
  if (arialabelNode === null) {
    // let the user know an error occurred
    figma.notify('Error occurred: please restart plugin if this continues.', {
      error: true,
      timeout: config.notifyTime
    });

    return;
  }

  // format some values
  const arialabelTypeCap = utils.capitalize(arialabelType);

  // set width of label background to account for new length
  const newValue = utils.capitalize(value.toLowerCase());
  const newLabel = `${arialabelTypeCap}: ${newValue}`;
  const widthMin = 52;
  const labelWidth = Math.floor(newLabel.length * 9.5);
  const newLabelWidth = labelWidth < widthMin ? widthMin : labelWidth;

  const updateName = (node) => {
    const arialabelNameNode = figma.getNodeById(node.id);
    arialabelNameNode.characters = newLabel;
  };

  // loop through children and make changes as needed
  arialabelNode.children.map((childNode) => {
    const { name } = childNode;
    const lowerName = name.toLowerCase();

    if (lowerName === 'label background') {
      if (childNode.children.length > 0) {
        // new version: label is child of background frame
        const labelChild = childNode.children[0];
        const labelName = labelChild.name.toLowerCase();
        if (labelName.includes('aria label name:')) {
          updateName(labelChild);
        }
      } else {
        // old version compatability: resize label based on new width
        childNode.resize(newLabelWidth, 32);
      }
    } else if (lowerName.includes('aria label name:')) {
      // old version compatiability: update new label
      updateName(childNode);
    }

    // update name of parent layer for future scanning/pick up where you left off
    arialabelNode.name = `Arialabel: ${arialabelType}:${newValue} | ${arialabelNode.id}`;

    return null;
  });
};

export default {
  noArialabels,
  add,
  completed,
  updateWithLabel
};
