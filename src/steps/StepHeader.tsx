import { Text } from '@fluentui/react-components';

interface Step2Props {
  title: string;
  isRequired: boolean;
}

const StepHeader: React.FC<Step2Props> = ({title, isRequired}) => {
  return (
    <Text
        weight='bold'
        size={600}
        align='center'
        style={{ marginBottom: '30px' }}
      >
        {title}
        {isRequired && (<span className='requiredField'>*</span>)}
      </Text>
  )
}

export default StepHeader
