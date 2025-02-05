import React, { useState, useRef } from 'react';
import {
  useId,
  Button,
  Textarea,
  Label,
  makeStyles,
  shorthands,
  Text,
  Image,
  Field,
  Toaster,
  useToastController,
  ToastTitle,
  Toast,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox
} from '@fluentui/react-components';

import axios from 'axios';
import './styles.css';

const useStyles = makeStyles({
  pageContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    justifyItems: 'left',
    margin: '10px'
  },
  formContainer: {
    width: '60%',
    minHeight: '800px',
    borderRadius: '30px',
    backgroundColor: '#fcf7f7',
    boxShadow: '10px 10px 5px #e8e6e6',
    padding: '10px'
  },
   contentContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '-340px',
    width: '135%',
    minHeight: '800px',
    borderRadius: '30px',
    backgroundColor: '#fcf7f7',
    boxShadow: '10px 10px 5px #e8e6e6',
    padding: '10px'

  },
  divContainer: {
    alignContent: 'center',
    fontSize: 'larger',
    fontWeight: '700',
    margin: '0 50px'
  },
  form: {
    display: 'flex',
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
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);
  const styles = useStyles();
  const [file, setFile] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setisError] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [mailSubject, setMailSubject] = useState<string>('');
  const [mailContent, setMailContent] = useState<string>('');
  const [isEmailSending, setisEmailSending] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [features, setFeatures] = useState<Array<{key:string, value:string, id:number}>>([]);
  const [checkedFeatures, setCheckedFeatures] = useState<Array<number>>([]);
  const [showLogoModal, setShowLogoModal] = useState<boolean>(false);

  const PORT = import.meta.env.VITE_PORT;
  const BASE_URL = import.meta.env.VITE_BASE_URL.replace('VITE_PORT', PORT);
  const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL.replace('VITE_PORT', PORT);
  
  const [ws, setWebsckt] = useState<WebSocket | null>(new WebSocket(WEBSOCKET_URL));
  const [message, setMessage] = useState<string>('');  

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files ? event.target.files[0] : null;
    setFile(uploadedFile);

    const formData = new FormData();
    if (uploadedFile) formData.append("file", uploadedFile);
    try {
      setIsLoading(true);
      setMessage('Fetching details from file.')
      const response = await axios.post(BASE_URL + 'file-process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const featureList: Array<{key:string, value:string, id:number}> = [];      
      const responseData = response.data
      delete responseData['filename']
      Object.keys(responseData).forEach((k, idx)=>{
        featureList.push({key: k, value: responseData[k], id:idx})
      })
      setFeatures(featureList)
      setModalOpen(true)
    } catch (e){
      console.log('Error extracting file.')
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedLogo = event.target.files ? event.target.files[0] : null;
    setLogo(uploadedLogo);

    const formData = new FormData();
    if (uploadedLogo) {
      formData.append("logo", uploadedLogo);
      formData.append("image", imageUrl);
    }
    
    try {
      const response = await axios.post(BASE_URL + 'logo-process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const responseData = response.data
      setImageUrl(responseData.image)
      setShowLogoModal(false);
    } catch (e){
      console.log('Error processing logo.')
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFields = () => {
    setPrompt('');
    setModalOpen(false); 
    setFeatures([]);
    setCheckedFeatures([]);
    setFile(null);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'generated-image.jpg';
    a.click();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    setIsLoading(true);
    setMessage('Connecting to server.')

    try {
      event.preventDefault();
      if (prompt) {
        const formData = { prompt };

        if(checkedFeatures.length){
          const ftData: Array<{string:string}> = []

          checkedFeatures.forEach(id => {
            const featureList = features.filter(obj=>obj.id == id)
            if (featureList.length) {
              const k = featureList[0].key
              const val = featureList[0].value
              ftData.push({[k]: val})
            }
          }) 

          formData['features'] = ftData
        }

        ws.send(JSON.stringify(formData));
        ws.onmessage = (e) => {
          const message = JSON.parse(e.data);
          if(message.hasOwnProperty('response')){
            setMessage(message.response);
          } else if(!message.hasOwnProperty('image')){
              setMessage(JSON.stringify(message));
          } else {
              setIsLoading(false);
              setShowLogoModal(true);
              setImageUrl(message?.image);
              setMailSubject(message?.mailSubject);
              setMailContent(message?.mailContent);
          }
        }
      } else {
        alert('Please fill out prompt field.');
        setIsLoading(false)
      }
    } catch (err) {
      console.log('Error while submitting form -- ', err);
      setIsLoading(false)
    }
  };

  const handlesendMail = async (event: React.FormEvent) => {
    try {
      event.preventDefault();

      const formData = new FormData();

      formData.append('subject', mailSubject);
      formData.append('body', mailContent);
      formData.append('image', imageUrl);
      setisEmailSending(true);
      const response = await axios.post(BASE_URL + 'send-mail', formData);
      setisEmailSending(false);
      dispatchToast(
        <Toast>
          <ToastTitle>Email sent successfully.</ToastTitle>
        </Toast>,
        { position: 'top-end', intent: 'success' }
      );
    } catch (err) {
      console.log('Error while submitting form -- ', err);
    }
  };

  const handleFeatureCheck = (event: React.FormEvent, id:number) => {
    if(event?.target?.checked){
      setCheckedFeatures([...checkedFeatures, id])
    } else {
      const chkdFeatures = [...checkedFeatures]
      const index = chkdFeatures.indexOf(id)
      chkdFeatures.splice(index, 1)
      setCheckedFeatures(chkdFeatures)
    }
  };

  const handleCancel = (event: React.FormEvent) => {
    setModalOpen(false); 
    setFeatures([]);
    setCheckedFeatures([])
    setFile(null)

    setShowLogoModal(false);
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <form className={styles.form}>
          <Text
            weight='bold'
            size={600}
            align='center'
            style={{ marginBottom: '30px' }}
          >
            Campaign Generator
          </Text>
          <Field label='Enter Prompt' required>
            <Textarea
              value={prompt}
              rows={5}
              onChange={(event, data) => setPrompt(data.value)}
              placeholder='Type your prompt here...'
              size='medium'
              appearance='outline'
            />
          </Field>

          <div>
            <input
              ref={fileInputRef}
              type='file'
              className={styles.fileInput}
              onChange={handleFileUpload}
            />
            <Button
              appearance='primary'
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </div>

          {file && <Label>Uploaded File: {file.name}</Label>}

          {checkedFeatures.length > 0 && (
            <>
              <h2 style={{marginBottom: '0'}}>Selected Features:</h2>
              <ul>
                {checkedFeatures.map(id=>(
                  <li key={id}>
                    <b>{features?.filter(obj=>obj.id===id)[0]?.key}:</b><br />
                    <span style={{marginLeft: '40px '}}>{features?.filter(obj=>obj.id===id)[0]?.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className={styles.buttonContainer}>
            <Button appearance='primary' onClick={handleSubmit} disabled={isLoading}>
              Submit
            </Button>

            <Button disabled={isLoading} onClick={handleResetFields}>
              Reset
            </Button>
          </div>
        </form>
      </div>

      <div className={styles.contentContainer}>
        {isError && (
          <div style={{ marginTop: '200px' }}>
            <p style={{ color: 'red' }}>
              Error generating image. Please try again.
            </p>
          </div>
        )}

        {isLoading 
        ? (<div className={styles.divContainer}>
            <div className="bouncingLoader">{Array.from(message).map((ch, indx) => (
              <span key={indx}>{ch}</span>))}
            </div>
          </div>)
        : (imageUrl?.length > 0 && (<div className={styles.divContainer}>
            <h3>
              Generated Image:{' '}
              <Button
                size='small'
                appearance='primary'
                onClick={handleDownload}
              >
                Download
              </Button>
            </h3>
            <Image
              alt='Car Image'
              shape='rounded'
              src={imageUrl}
              style={{ boxShadow: '10px 10px 5px #d9d1d0' }}
            />
            <br />
            <br />
              <div>
                <label htmlFor='mailSubject'>
                  <strong>Mail Subject:</strong>{' '}
                </label>
                <br />
                <input
                  type='text'
                  id='mailSubject'
                  name='mailSubject'
                  value={mailSubject}
                  size={mailSubject.length}
                  readOnly
                />
                <br />
                <br />
                <label htmlFor='mailContent' style={{ display: 'block' }}>
                  <strong>Mail Content: </strong>
                </label>

                <textarea
                  id='mailContent'
                  name='mailContent'
                  value={mailContent}
                  rows={mailContent.split('.').length}
                  cols={100}
                  readOnly
                />
                <br />
                <br />
                <Toaster toasterId={toasterId} />
                <Button
                  size='small'
                  appearance='primary'
                  onClick={handlesendMail}
                  disabled={isEmailSending}
                >
                  Send Email
                </Button>
              </div>
          </div>)
        )}
      </div>

      <Dialog modalType="modal" open={modalOpen}>
        <DialogSurface aria-describedby={undefined}>
          <DialogBody>
            <DialogTitle>Select from below features</DialogTitle>
            <DialogContent>
              {features.map(obj => (
                <Checkbox
                key={obj.id}
                checked={checkedFeatures.includes(obj.id)}
                onChange={e=>handleFeatureCheck(e, obj.id)}
                label= {<span><b>{obj.key}:</b> {obj.value}</span>}
              />
              ))}
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="primary" onClick={e=>setModalOpen(false)}>
                  Use Parameters
                </Button>
              </DialogTrigger>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" onClick={handleCancel}>Cancel</Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog modalType="modal" open={showLogoModal}>
        <DialogSurface aria-describedby={undefined}>
          <DialogBody>
            <DialogTitle>Upload Logo</DialogTitle>
            <DialogContent>
              <div style={{marginTop: '20px', marginBottom: '50px'}}>
                <input
                  ref={fileInputRef}
                  type='file'
                  className={styles.fileInput}
                  onChange={handleLogoUpload}
                />
                <Button
                  appearance='primary'
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </div>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" onClick={handleCancel}>Cancel</Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
};

export default App;
