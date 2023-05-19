import * as React from 'react';

// components
import {
  Alert,
  AnnotationStepPage,
  scrollToBottomOfAnnotationStep,
  EmptyStepSelection,
  HeadingStep
} from '../components';

// icons
import { SvgWarning, SvgLabel } from '../icons';

// app state
import Context from '../context';

const Arialabels = () => {
  // main app state
  const cnxt = React.useContext(Context);
  const { arialabels, page, pageType, stepsCompleted } = cnxt;
  const { removeNodes, sendToFigma, updateState, zoomTo } = cnxt;

  // ui state
  const routeName = 'Arialabels';
  const arialabelsArray = Object.keys(arialabels);
  const arialabelsAreSet = arialabelsArray.length !== 0;

  // state defaults
  const isCompleted = stepsCompleted.includes(routeName);
  const defaultNoArialabels = isCompleted && arialabelsArray.length === 0;

  // local state
  const [selected, setSelected] = React.useState(null);
  const [noArialabels, setNoArialabels] = React.useState(defaultNoArialabels);
  const [needsLabel, setNeedsLabel] = React.useState([]);
  const [labelsTemp, setLabelsTemp] = React.useState({});

  const onAddArialabel = (arialabelType) => {
    const { bounds, id } = page;

    // scroll to bottom of main
    scrollToBottomOfAnnotationStep();

    // let figma side know, time to place that rectangle
    sendToFigma('add-arialabel', {
      bounds,
      page,
      pageId: id,
      arialabel: arialabelType,
      pageType
    });
  };

  const onRemoveArialabel = (idToRemove) => {
    // remove from main state
    const newArialabelsObj = { ...arialabels };
    delete newArialabelsObj[idToRemove];

    // update main state
    updateState('arialabels', newArialabelsObj);

    // remove node on Figma Document (array of IDs)
    removeNodes([idToRemove]);

    // check if already completed step
    const indexFound = stepsCompleted.indexOf(routeName);
    if (indexFound >= 0) {
      const newStepsCompleted = [...stepsCompleted];
      newStepsCompleted.splice(indexFound, 1);

      // update main state
      updateState('stepsCompleted', newStepsCompleted);
    }
  };

  const onClick = () => {
    setSelected('aria label');
    setNoArialabels(false);
    onAddArialabel('aria label');
  };

  const showWarning =
    needsLabel.length > 0 &&
    Object.keys(labelsTemp).length !== needsLabel.length;

  const onDoneWithArialabels = () => {
    if (noArialabels) {
      sendToFigma('no-arialabel', {
        page,
        bounds: page.bounds,
        name: page.name,
        pageId: page.id,
        pageType
      });
    } else {
      sendToFigma('completed-arialabel', {
        page,
        pageType
      });
    }
  };

  const checkForDuplicates = () => {
    // const typesArray = [];
    const typesDupArray = [];
    const rowsNeedLabelArray = [];

    // add all aria labels used
    typesDupArray.push('aria label');

    // loop through to see what needs a label
    Object.values(arialabels).map((row) => {
      const { id, label } = row;
      const noLabel = label === null || label === '';

      if (noLabel) {
        rowsNeedLabelArray.push(id);
      }

      return null;
    });

    // do we have arialabels that need labels?
    if (rowsNeedLabelArray.length > 0) {
      setNeedsLabel(rowsNeedLabelArray);
    }
  };

  const onChange = (e, id) => {
    const newLabelsTemp = { ...labelsTemp };

    // don't allow | or :
    const newLabelValue = e.target.value.replace(/[|:]/g, '');
    newLabelsTemp[id] = { value: newLabelValue };

    setLabelsTemp(newLabelsTemp);
  };

  const onBlur = (id, type) => {
    // grab label if exists in temp
    // onBlur with original value doesn't do any updates to Figma
    const value = labelsTemp[id]?.value || null;

    // update label if needed
    if (value !== null) {
      // update label on figma document
      sendToFigma('update-arialabel-label', { id, arialabelType: type, value });
    }
  };

  const onEmptySelected = () => {
    if (selected !== null) setSelected(null);
    setNoArialabels(!noArialabels);
  };

  // on arialabels change, check for duplicates to add optional labels
  React.useEffect(() => {
    // mount
    checkForDuplicates();
  }, [arialabels]);

  const getPrimaryAction = () => {
    if (arialabelsAreSet || noArialabels) {
      return {
        completesStep: true,
        onClick: onDoneWithArialabels
      };
    }

    return null;
  };

  return (
    <AnnotationStepPage
      title="Aria labels"
      routeName={routeName}
      bannerTipProps={{ pageType, routeName }}
      footerProps={{
        primaryAction: getPrimaryAction(),
        secondaryAction: null
      }}
    >
      <React.Fragment>
        {showWarning && (
          <React.Fragment>
            <Alert
              icon={<SvgWarning />}
              style={{ padding: 0 }}
              text="Specify desired aria label wording."
              type="warning"
            />
            <div className="spacer1" />
          </React.Fragment>
        )}

        {arialabelsAreSet && (
          <React.Fragment>
            {arialabelsArray.map((key) => {
              const { id, label, type } = arialabels[key];
              const showLabel = label !== null || needsLabel.includes(id);
              const hasTempLabel = labelsTemp[id]?.value || label;

              // flag to add clarifying label info
              const warnClass =
                needsLabel.includes(id) && hasTempLabel === null
                  ? ' warning'
                  : '';

              return (
                <div key={key} className="row-label flex-row-space-between">
                  <div className="flex-row-center">
                    <div className="label">aria label</div>

                    {showLabel && (
                      <React.Fragment>
                        <div className="spacer2w" />
                        <div className="muted">Label</div>
                        <div className="spacer1w" />
                        <input
                          className={`input${warnClass}`}
                          maxLength="125"
                          type="text"
                          onBlur={() => onBlur(id, type)}
                          onChange={(e) => onChange(e, id)}
                          onFocus={() => {
                            // zoom to image in figma
                            zoomTo([id], true);
                          }}
                          placeholder="Type in name"
                          value={hasTempLabel || ''}
                        />
                      </React.Fragment>
                    )}
                  </div>

                  <div
                    className="btn-remove"
                    onClick={() => onRemoveArialabel(id)}
                    onKeyPress={() => onRemoveArialabel(id)}
                    role="button"
                    tabIndex="0"
                  >
                    <div className="remove-dash" />
                  </div>
                </div>
              );
            })}

            <div className="spacer1" />
            <div className="divider" />
            <div className="spacer2" />
          </React.Fragment>
        )}

        <HeadingStep number={1} text="Select aria label" />
        {!arialabelsAreSet && (
          <EmptyStepSelection
            isSelected={noArialabels}
            onClick={onEmptySelected}
            stepName="aria labels"
          />
        )}
        {!noArialabels && (
          <div className="button-group">
            <div className="container-selection-button">
              <div
                className="selection-button"
                onClick={onClick}
                onKeyPress={onClick}
                role="button"
                tabIndex="0"
              >
                <div>
                  <SvgLabel />
                </div>
              </div>

              <div className="selection-button-label">aria label</div>
            </div>
          </div>
        )}
        {selected && (
          <React.Fragment>
            <div className="spacer2" />

            <HeadingStep
              number={2}
              text={`Place the overlay over the aria label area`}
            />
          </React.Fragment>
        )}
      </React.Fragment>
    </AnnotationStepPage>
  );
};

export default Arialabels;
