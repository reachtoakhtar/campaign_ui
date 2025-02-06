import { useWizard } from 'react-use-wizard';
import { Tag } from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import StepHeader from './StepHeader';
import _ from 'lodash';
import React from 'react';

interface Step4Props {
  imageResolutions: Array<{ width: number; height: number; id: number }>;
  setImageResolutions: React.Dispatch<
    React.SetStateAction<Array<{ width: number; height: number; id: number }>>
  >;
  imageResolutionList: Array<{ width: number; height: number; id: number }>;
  setImageResolutionList: React.Dispatch<
    React.SetStateAction<Array<{ width: number; height: number; id: number }>>
  >;
  styles: Record<string, string>;
}

const Step4: React.FC<Step4Props> = ({
  imageResolutions,
  setImageResolutions,
  imageResolutionList,
  setImageResolutionList,
  styles,
}) => {
  const { handleStep } = useWizard();

  handleStep(() => {
    // alert(`Going to step ${stepNum}`);
  });

  useEffect(() => {
    const unselectedList = [];
    imageResolutionList.forEach(obj => {
      const filteredList = imageResolutions.filter(
        updtRsln => updtRsln.id === obj.id,
      );
      if (!filteredList.length) {
        unselectedList.push(obj);
      }
    });
    setImageResolutionList([
      ..._.cloneDeep(imageResolutions).sort((a, b) => a.width - b.width),
      ..._.cloneDeep(unselectedList).sort((a, b) => a.width - b.width),
    ]);
  }, []);

  const handleClick = imageResolution => {
    let updatedResolutions = [];

    const ftList = imageResolutions.filter(ft => ft.id === imageResolution.id);
    if (ftList.length) {
      // updatedResolutions = _.cloneDeep(imageResolutions)
      // updatedResolutions = updatedResolutions.filter(ft => ft.id !== imageResolution.id)
      // setImageResolutions(updatedResolutions)

      // Allow only one selection for now. Uncomment the above three lines
      // and comment out the below lines if you wish to allow multiple selections.
      if (imageResolutions[0].id === imageResolution.id) {
        updatedResolutions = [];
      } else {
        updatedResolutions = [{ ...imageResolution }];
      }
      setImageResolutions(updatedResolutions);
    } else {
      updatedResolutions.push(imageResolution);
      setImageResolutions(updatedResolutions);
    }

    const unselectedList = [];
    imageResolutionList.forEach(obj => {
      const filteredList = updatedResolutions.filter(
        updtRsln => updtRsln.id === obj.id,
      );
      if (!filteredList.length) {
        unselectedList.push(obj);
      }
    });

    setImageResolutionList([
      ..._.cloneDeep(updatedResolutions).sort((a, b) => a.width - b.width),
      ..._.cloneDeep(unselectedList).sort((a, b) => a.width - b.width),
    ]);
  };

  return (
    <div className={styles.form}>
      <StepHeader title="Please Select Image Resolution" isRequired={true} />

      <div className={styles.contentContainer}>
        {imageResolutionList.map((imageResolution, indx) => (
          <React.Fragment key={indx}>
            {imageResolutions.filter(obj => obj.id === imageResolution.id)
              .length > 0 ? (
              <Tag
                key={indx}
                size="medium"
                as="button"
                className="tagDiv"
                appearance="brand"
                icon={<>&#x2713;</>}
                onClick={e => handleClick(imageResolution)}
              >
                {imageResolution.width} x {imageResolution.height}
              </Tag>
            ) : (
              <Tag
                key={indx}
                size="medium"
                as="button"
                className="tagDiv"
                appearance="outline"
                onClick={e => handleClick(imageResolution)}
              >
                {imageResolution.width} x {imageResolution.height}
              </Tag>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Step4;
