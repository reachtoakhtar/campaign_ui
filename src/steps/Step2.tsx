import { Button, Label, Tag } from '@fluentui/react-components';
import { useRef, useState } from 'react';
import StepHeader from './StepHeader';
import _ from 'lodash';
import React from 'react';
import axios from 'axios';

interface Step2Props {
  featureList: Array<{ key: string; value: string; id: number }>;
  setFeatureList: React.Dispatch<
    React.SetStateAction<Array<{ key: string; value: string; id: number }>>
  >;
  features: Array<{ key: string; value: string; id: number }>;
  setFeatures: React.Dispatch<
    React.SetStateAction<Array<{ key: string; value: string; id: number }>>
  >;
  setTargetAudienceList: React.Dispatch<React.SetStateAction<Array<string>>>;
  setTargetAudiences: React.Dispatch<React.SetStateAction<Array<string>>>;
  uploadedFile: File | null;
  setUploadedFile: React.Dispatch<React.SetStateAction<File | null>>;
  styles: Record<string, string>;
}

const Step2: React.FC<Step2Props> = ({
  featureList,
  setFeatureList,
  features,
  setFeatures,
  setTargetAudienceList,
  setTargetAudiences,
  uploadedFile,
  setUploadedFile,
  styles,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = feature => {
    let updatedFeatures = _.cloneDeep(features);
    const ftList = features.filter(ft => ft.id === feature.id);
    if (ftList.length) {
      updatedFeatures = updatedFeatures.filter(ft => ft.id !== feature.id);
      setFeatures(updatedFeatures);
    } else {
      updatedFeatures.push(feature);
      setFeatures(updatedFeatures);
    }

    const unselectedList = [];
    featureList.forEach(obj => {
      const filteredList = updatedFeatures.filter(
        updtFtr => updtFtr.id === obj.id,
      );
      if (!filteredList.length) {
        unselectedList.push(obj);
      }
    });

    setFeatureList([
      ..._.cloneDeep(updatedFeatures).sort((a, b) =>
        a.key.localeCompare(b.key),
      ),
      ..._.cloneDeep(unselectedList).sort((a, b) => a.key.localeCompare(b.key)),
    ]);
  };

  const PORT = import.meta.env.VITE_PORT;
  const BASE_URL = import.meta.env.VITE_BASE_URL.replace('VITE_PORT', PORT);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const uploadedFile = event.target.files ? event.target.files[0] : null;
    setUploadedFile(uploadedFile);

    const formData = new FormData();
    if (uploadedFile) formData.append('file', uploadedFile);
    try {
      setIsLoading(true);
      const response = await axios.post(BASE_URL + 'file-process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.status === 200) {
        const featureList: Array<{ key: string; value: string; id: number }> =
          [];
        const featureSummary = response.data?.feature_summary;
        Object.keys(featureSummary).forEach((k, idx) => {
          featureList.push({ key: k, value: featureSummary[k], id: idx });
        });
        setFeatureList(featureList.sort((a, b) => a.key.localeCompare(b.key)));

        const segments = response.data?.target_audience?.segments;
        const targetAudienceList: Array<string> = segments.map(
          segment =>
            segment
              .split(/[\s-]+/) // Split by space or dash
              .map(
                word =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(), // Capitalize first letter, rest lowercase
              )
              .join(' '), // Join back with spaces
        );
        setTargetAudienceList(targetAudienceList.sort());
      } else {
        setFeatureList([]);
        setTargetAudienceList([]);
      }
      setFeatures([]);
      setTargetAudiences([]);
    } catch (e) {
      console.log('Error extracting file.', e);
      setFeatureList([]);
      setTargetAudienceList([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.form}>
      <StepHeader title="Upload specification document" isRequired={false} />
      <div className={styles.contentContainer}>
        <input
          ref={fileInputRef}
          type="file"
          className={styles.fileInput}
          onChange={handleFileUpload}
        />
        <Button
          appearance="primary"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Specification Document
        </Button>

        {uploadedFile && (
          <Label style={{ marginLeft: '20px' }}>
            <h4>{uploadedFile.name}</h4>
          </Label>
        )}
      </div>

      {isLoading ? (
        <div className={styles.contentContainer}>
          <div className="bouncingLoader">
            {Array.from('Fetching details from file').map((ch, indx) => (
              <span key={indx}>{ch}</span>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {featureList.length > 0 && (
            <div className={`${styles.contentContainer} divLabel`}>
              Feature List
            </div>
          )}
          {featureList.map((feature, indx) => (
            <div key={indx}>
              {features.filter(obj => obj.id === feature.id).length > 0 ? (
                <Tag
                  key={indx}
                  size="medium"
                  as="span"
                  className="tagDivFeature"
                  appearance="brand"
                  secondaryText={feature.value}
                  icon={<>&#x2713;</>}
                  onClick={e => handleClick(feature)}
                >
                  {feature.key}
                </Tag>
              ) : (
                <Tag
                  key={indx}
                  size="medium"
                  as="button"
                  className="tagDivFeatureNoIcon"
                  appearance="outline"
                  secondaryText={feature.value}
                  onClick={e => handleClick(feature)}
                >
                  {feature.key}
                </Tag>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Step2;
