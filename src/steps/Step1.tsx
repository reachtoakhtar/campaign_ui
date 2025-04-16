import { Textarea } from '@fluentui/react-components';
import StepHeader from './StepHeader';
import React from 'react';

interface Step1Props {
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  styles: Record<string, string>;
}

const Step1: React.FC<Step1Props> = ({ prompt, setPrompt, styles }) => {
  return (
    <div className={styles.form}>
      <StepHeader title="Enter your campaign requirements" isRequired={true} />
      <Textarea
        id="promptId"
        value={prompt}
        rows={100}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Enter your requirements..."
        size="medium"
        appearance="outline"
      />
    </div>
  );
};

export default Step1;
