import { useWizard } from 'react-use-wizard';
import { Tag } from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import StepHeader from './StepHeader';
import React from 'react';
import axios from 'axios';

interface Step3Props {
  prompt: string;
  targetAudienceList: Array<string>;
  setTargetAudienceList: React.Dispatch<React.SetStateAction<Array<string>>>;
  targetAudiences: Array<string>;
  setTargetAudiences: React.Dispatch<React.SetStateAction<Array<string>>>;
  styles: Record<string, string>;
}

const Step3: React.FC<Step3Props> = ({
  prompt,
  targetAudienceList,
  setTargetAudienceList,
  targetAudiences,
  setTargetAudiences,
  styles,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const PORT = import.meta.env.VITE_PORT;
  const BASE_URL = import.meta.env.VITE_BASE_URL.replace('VITE_PORT', PORT);

  const handleClick = trgtAudience => {
    const index = targetAudiences.indexOf(trgtAudience);

    let targetAud = [...targetAudiences];
    if (index >= 0) {
      targetAud = targetAud.filter(val => val !== trgtAudience);
      setTargetAudiences(targetAud);
    } else {
      targetAud.push(trgtAudience);
      setTargetAudiences(targetAud);
    }

    const unselectedList = targetAudienceList.filter(
      val => targetAud.indexOf(val) < 0,
    );
    setTargetAudienceList([...targetAud.sort(), ...unselectedList.sort()]);
  };

  const fetchTargetAudiences = async () => {
    const formData = new FormData();
    formData.append('prompt', prompt);

    try {
      setIsLoading(true);
      const response = await axios.post(BASE_URL + 'file-process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.status === 200) {
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
        setTargetAudienceList([]);
      }
      setTargetAudiences([]);
    } catch (e) {
      console.log('Error extracting file.', e);
      setTargetAudienceList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!targetAudienceList.length) {
      fetchTargetAudiences();
    }

    const unselectedList = targetAudienceList.filter(
      val => targetAudiences.indexOf(val) < 0,
    );

    setTargetAudienceList([
      ...targetAudiences.sort(),
      ...unselectedList.sort(),
    ]);
  }, []);

  return (
    <div className={styles.form}>
      <StepHeader
        title="Please select your target audience"
        isRequired={true}
      />
      {isLoading ? (
        <div className={styles.contentContainer}>
          <div
            className="bouncingLoader"
            style={{ marginTop: '300px !important' }}
          >
            {Array.from('Loading Target Audiences. Please Wait.').map(
              (ch, indx) => (
                <span key={indx}>{ch}</span>
              ),
            )}
          </div>
        </div>
      ) : (
        <div>
          {targetAudienceList.length > 0 && (
            <div className={`${styles.contentContainer} divLabel`}>
              Target Audience List
            </div>
          )}
          {targetAudienceList.map((targetAudience, indx) => (
            <div key={indx}>
              {targetAudiences.indexOf(targetAudience) >= 0 ? (
                <Tag
                  key={indx}
                  size="medium"
                  as="button"
                  className="tagDiv"
                  appearance="brand"
                  icon={<>&#x2713;</>}
                  onClick={e => handleClick(targetAudience)}
                >
                  {targetAudience}
                </Tag>
              ) : (
                <Tag
                  key={indx}
                  size="medium"
                  as="button"
                  className="tagDiv"
                  appearance="outline"
                  onClick={e => handleClick(targetAudience)}
                >
                  {targetAudience}
                </Tag>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Step3;
