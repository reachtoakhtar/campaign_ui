import { Button } from '@fluentui/react-components';
import React from 'react';
import { useWizard } from 'react-use-wizard';

interface NavigationProps {
  prompt: string;
  specDoc: File | null;
  features: Array<{ key: string; value: string; id: number }>;
  targetAudiences: Array<string>;
  imageResolutions: Array<{ width: number; height: number; id: number }>;
  styles: Record<string, string>;
}

const Navigation: React.FC<NavigationProps> = ({
  prompt,
  specDoc,
  features,
  targetAudiences,
  imageResolutions,
  styles,
}) => {
  const {
    nextStep,
    previousStep,
    activeStep,
    isLoading,
    isLastStep,
    isFirstStep,
  } = useWizard();

  return (
    <div className={styles.contentContainer}>
      <Button
        style={{ marginRight: '10px' }}
        appearance="primary"
        onClick={() => previousStep()}
        disabled={isLoading || isFirstStep}
      >
        Previous
      </Button>

      <Button
        style={{ marginLeft: '10px' }}
        appearance="primary"
        onClick={() => nextStep()}
        disabled={
          isLoading ||
          isLastStep ||
          (activeStep === 0 && !prompt?.length) ||
          (activeStep === 2 && !targetAudiences.length) ||
          (activeStep === 3 && !imageResolutions.length)
        }
      >
        Next
      </Button>
    </div>
  );
};

export default Navigation;
