import React, { useState, useEffect, useRef } from 'react';
import {
  useId,
  Button,
  Textarea,
  Label,
  makeStyles,
  shorthands,
  Text,
  Spinner,
  Image,
  Field,
  Caption2,
  Toaster,
  useToastController,
  ToastTitle,
  Toast,
} from '@fluentui/react-components';

import axios from 'axios';
import './styles.css';

const useStyles = makeStyles({
  pageContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    justifyItems: 'left',
    marginLeft: '10px'
  },
  formContainer: {
    marginTop: '85px',
    width: '60%',
    height: '80vh',
    borderRadius: '30px',
    backgroundColor: '#fcf7f7',
    boxShadow: '10px 10px 5px #e8e6e6',
  },
   contentContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '-340px',
    marginTop: '85px',
    width: '135%',
    height: '80vh',
    borderRadius: '30px',
    backgroundColor: '#fcf7f7',
    boxShadow: '10px 10px 5px #e8e6e6',
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
  // const [isFileDisplay, setisFileDisplay] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setisLoading] = useState<boolean>(false);
  const [isError, setisError] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [mailsubject, setmailsubject] = useState<string>('');
  const [mailcontent, setmailcontent] = useState<string>('');
  const [isEmailSending, setisEmailSending] = useState<boolean>(false);

  const [messages, setMessages] = useState<Array<string>>([]);
  const [websckt, setWebsckt] = useState<WebSocket | null>(null);

  const PORT = import.meta.env.VITE_PORT;
  const BASE_URL = import.meta.env.VITE_BASE_URL.replace('VITE_PORT', PORT);
  const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL.replace('VITE_PORT', PORT);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files ? event.target.files[0] : null;
    setFile(uploadedFile);
    // setisFileDisplay(true);
  };

  const handleResetFields = () => {
    setPrompt('');
    // setisFileDisplay(false)
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'generated-image.jpg';
    a.click();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    try {
      event.preventDefault();
      if (prompt) {
        const formData = { prompt };
        if (file) {
          formData['filename'] = file.name;
          websckt.send(file);
        }

        websckt.send(JSON.stringify(formData));
        websckt.onmessage = (e) => {
          const message = JSON.parse(e.data);
          if(message.hasOwnProperty('image')){
            setImageUrl(message?.image);
          }
          else if(message.hasOwnProperty('mailSubject')) {
            setmailsubject(message?.mailSubject);
          }
          else if(message.hasOwnProperty('mailContent')) {
            setmailcontent(message?.mailContent);
          } else {
            setMessages(message.response);
          }
       }
      } else {
        alert('Please fill out prompt field.');
      }
    } catch (err) {
      console.log('Error while submitting form -- ', err);
    }
  };

  const handlesendMail = async (event: React.FormEvent) => {
    try {
      event.preventDefault();

      const formData = new FormData();

      console.log(mailsubject, mailcontent, imageUrl);

      formData.append('subject', mailsubject);
      formData.append('body', mailcontent);
      formData.append('image', imageUrl);
      setisEmailSending(true);
      const response = await axios.post(BASE_URL + 'send-mail', formData);
      console.log({ response });
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

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);
    setWebsckt(ws);
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
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

          <div className={styles.buttonContainer}>
            <Button appearance='primary' type='submit' disabled={isLoading}>
              Submit
            </Button>

            <Button disabled={isLoading} onClick={handleResetFields}>
              Reset
            </Button>
          </div>
        </form>
      </div>

      <div className={styles.contentContainer}>
        {/* {isLoading && <Spinner appearance='primary' label='Generating Image' />} */}
        {isError && (
          <div style={{ marginTop: '200px' }}>
            <p style={{ color: 'red' }}>
              Error generating image. Please try again.
            </p>
          </div>
        )}

        {imageUrl.length  
        ? (<div className={styles.divContainer}>
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
            {mailsubject && mailcontent && (
              <>
                <label htmlFor='mailSubject'>
                  <strong>Mail Subject:</strong>{' '}
                </label>
                <br />
                <input
                  type='text'
                  id='mailsubject'
                  name='mailsubject'
                  value={mailsubject}
                  size={mailsubject.length}
                  readOnly
                />
                <br />
                <br />
                <label htmlFor='mailContent' style={{ display: 'block' }}>
                  <strong>Mail Content: </strong>
                </label>

                <textarea
                  id='mailcontent'
                  name='mailcontent'
                  value={mailcontent}
                  rows={mailcontent.split('.').length}
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
              </>
            )}
            {!mailsubject && !mailcontent && (
              <Caption2>
                !! Mail subject and content could not be generated.
              </Caption2>
            )}
          </div>)
        : (<div className={styles.divContainer}>
            {messages}
            <div className='bouncingLoader'>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>)}
      </div>
    </div>
  )
};

export default App;
