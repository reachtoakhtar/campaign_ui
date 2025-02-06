import React, { useState } from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import _ from 'lodash';

import { Wizard } from 'react-use-wizard';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import Step5 from './steps/Step5';
import './styles.css';
import Navigation from './Navigation';

const useStyles = makeStyles({
  pageContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    justifyItems: 'center',
    alignItems: 'center',
    margin: '10px 0',
  },
  formContainer: {
    width: '90%',
    minHeight: '95vh',
    backgroundColor: '#fcf7f7',
    padding: '10px',
  },
  contentContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100px',
  },
  divContainer: {
    alignContent: 'center',
    fontSize: 'larger',
    fontWeight: '700',
    margin: '0 50px',
  },
  form: {
    display: 'flex',
    minHeight: '500px',
    flexDirection: 'column',
    rowGap: '20px',
    ...shorthands.margin('50px'),
  },
  fileInput: {
    display: 'none',
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
  },
});

const App: React.FC = () => {
  const styles = useStyles();
  const [prompt, setPrompt] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagesPerTarget, setImagesPerTarget] = useState<{
    [key: string]: { accepted: Array<string>; rejected: Array<string> };
  }>({});
  const [emailPerTarget, setEmailPerTarget] = useState<{
    [key: string]: { mail_subject: string; mail_content: string };
  }>({});
  const [featureList, setFeatureList] = useState<
    Array<{ key: string; value: string; id: number }>
  >([]);
  const [features, setFeatures] = useState<
    Array<{ key: string; value: string; id: number }>
  >([]);
  const [targetAudienceList, setTargetAudienceList] = useState<Array<string>>(
    [],
  );
  const [targetAudiences, setTargetAudiences] = useState<Array<string>>([]);

  const [imageResolutions, setImageResolutions] = useState<
    Array<{ width: number; height: number; id: number }>
  >([]);
  const [imageResolutionList, setImageResolutionList] = useState<
    Array<{ width: number; height: number; id: number }>
  >(
    [
      { width: 360, height: 640, id: 0 },
      { width: 414, height: 896, id: 1 },
      { width: 512, height: 512, id: 2 },
      // {width: 1024, height: 768, id:3},
      // {width: 1366, height: 768, id:4},
      // {width: 1536, height: 864, id:5},
      // { width: 1920, height: 1080, id: 6 },
    ].sort((a, b) => a.width - b.width),
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <div className={`${styles.contentContainer} headerContainer`}>
          Campaign Generator
        </div>
        <Wizard
          header={
            <Navigation
              prompt={prompt}
              specDoc={uploadedFile}
              features={features}
              targetAudiences={targetAudiences}
              imageResolutions={imageResolutions}
              styles={styles}
            />
          }
          footer={
            <Navigation
              prompt={prompt}
              specDoc={uploadedFile}
              features={features}
              targetAudiences={targetAudiences}
              imageResolutions={imageResolutions}
              styles={styles}
            />
          }
        >
          <Step1 prompt={prompt} setPrompt={setPrompt} styles={styles} />
          <Step2
            featureList={featureList}
            setFeatureList={setFeatureList}
            features={features}
            setFeatures={setFeatures}
            setTargetAudienceList={setTargetAudienceList}
            setTargetAudiences={setTargetAudiences}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            styles={styles}
          />
          <Step3
            prompt={prompt}
            targetAudienceList={targetAudienceList}
            setTargetAudienceList={setTargetAudienceList}
            targetAudiences={targetAudiences}
            setTargetAudiences={setTargetAudiences}
            styles={styles}
          />
          <Step4
            imageResolutions={imageResolutions}
            setImageResolutions={setImageResolutions}
            imageResolutionList={imageResolutionList}
            setImageResolutionList={setImageResolutionList}
            styles={styles}
          />
          <Step5
            prompt={prompt}
            features={features}
            targetAudiences={targetAudiences}
            imageResolutions={imageResolutions}
            imagesPerTarget={imagesPerTarget}
            setImagesPerTarget={setImagesPerTarget}
            emailPerTarget={emailPerTarget}
            setEmailPerTarget={setEmailPerTarget}
            styles={styles}
          />
        </Wizard>
      </div>
    </div>
  );
};

export default App;
