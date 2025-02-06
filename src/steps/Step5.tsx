import {
  Button,
  Image,
  Toaster,
  useId,
  TabList,
  SelectTabEvent,
  SelectTabData,
  TabValue,
  Tab,
  Dialog,
  DialogSurface,
  DialogContent,
  DialogBody,
  DialogActions,
  DialogTrigger,
  DialogTitle,
  Checkbox,
  CheckboxProps,
  useToastController,
  Toast,
  ToastTitle,
} from '@fluentui/react-components';
import { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import React from 'react';
import axios from 'axios';

interface Step5Props {
  prompt: string;
  features: Array<{ key: string; value: string; id: number }>;
  targetAudiences: Array<string>;
  imageResolutions: Array<{ width: number; height: number; id: number }>;
  imagesPerTarget: {
    [key: string]: { accepted: Array<string>; rejected: Array<string> };
  };
  setImagesPerTarget: React.Dispatch<
    React.SetStateAction<{
      [key: string]: { accepted: Array<string>; rejected: Array<string> };
    }>
  >;
  emailPerTarget: {
    [key: string]: { mail_subject: string; mail_content: string };
  };
  setEmailPerTarget: React.Dispatch<
    React.SetStateAction<{
      [key: string]: { mail_subject: string; mail_content: string };
    }>
  >;
  styles: Record<string, string>;
}

const Step5: React.FC<Step5Props> = ({
  prompt,
  features,
  targetAudiences,
  imageResolutions,
  imagesPerTarget,
  setImagesPerTarget,
  emailPerTarget,
  setEmailPerTarget,
  styles,
}) => {
  const PORT = import.meta.env.VITE_PORT;
  const BASE_URL = import.meta.env.VITE_BASE_URL.replace('VITE_PORT', PORT);
  const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL.replace(
    'VITE_PORT',
    PORT,
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [webSockt, setWebsckt] = useState<WebSocket | null>(null);
  const [closeWebSocket, setCloseWebSocket] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [generateButtonClicked, setGenerateButtonClicked] =
    useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<TabValue>('');
  const [selectedImageTab, setSelectedImageTab] = useState<TabValue>('');
  const [showLogoModal, setShowLogoModal] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = React.useState<CheckboxProps['checked']>(false);
  const [isEmailSending, setIsEmailSending] = React.useState<boolean>(false);

  const createWebSocket = () => {
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
      setIsLoading(true);
      setMessage('Connecting to server.');

      try {
        const ftData: Array<{ [key: string]: string }> = [];
        features.forEach(feature => {
          ftData.push({ [feature.key]: feature.value });
        });

        const formData = {
          prompt,
          targetAudiences,
          features: ftData,
          imageResolutions,
        };
        socket.send(JSON.stringify(formData));
      } catch (err) {
        console.log('Something went wrong.', err);
      }
    };

    socket.onmessage = e => {
      const message = JSON.parse(e.data);
      if (message.hasOwnProperty('error')) {
        setIsLoading(false);
      } else if (message.hasOwnProperty('response')) {
        setMessage(message.response);
      } else {
        setIsLoading(false);
        const images = message?.images_per_target;
        setImagesPerTarget(images);

        setCloseWebSocket(true);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket closed. Reconnecting...');
      if (!closeWebSocket) {
        setTimeout(createWebSocket, 500); // Reconnect after 500 ms
      }
    };

    socket.onerror = error => {
      console.log('WebSocket error:', error);
    };

    return socket;
  };

  useEffect(() => {
    setSelectedTab(targetAudiences[0]);
    setSelectedImageTab('accepted');

    // Cleanup on unmount (close the WebSocket)
    return () => {
      if (webSockt?.readyState === WebSocket.OPEN) {
        webSockt.close();
        console.log('WebSocket closed on cleanup');
      }
    };
  }, []);

  const handleGenerateButtonClick = e => {
    // setIsLoading(true);
    setGenerateButtonClicked(true);

    // Create WebSocket
    const newSocket = createWebSocket();
    setWebsckt(newSocket);
  };

  const onTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value);
  };

  const onImageTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedImageTab(data.value);
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const uploadedLogo = event.target.files ? event.target.files[0] : null;
    const images = {
      accepted: imagesPerTarget[selectedTab]['accepted'],
      rejected: [],
    };

    if (checked) {
      images['rejected'] = imagesPerTarget[selectedTab]['rejected'];
    }

    const formData = new FormData();
    if (uploadedLogo) {
      formData.append('logo', uploadedLogo);
      formData.append('images', JSON.stringify(images));
    }

    try {
      const response = await axios.post(BASE_URL + 'logo-process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const responseData = response.data;
      const tempImagesPerTarget = _.cloneDeep(imagesPerTarget);
      tempImagesPerTarget[selectedTab]['accepted'] = responseData.accepted;
      if (responseData.rejected.length) {
        tempImagesPerTarget[selectedTab]['rejected'] = responseData.rejected;
      }
      setImagesPerTarget(tempImagesPerTarget);
      setShowLogoModal(false);
    } catch (e) {
      console.log('Error processing logo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = imageUrl => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'generated-image.jpg';
    a.click();
  };

  const generateEmail = async (event: React.FormEvent) => {
    const formData = new FormData();
    if (!emailPerTarget.hasOwnProperty(selectedTab)) {
      formData.append('user_prompt', prompt);
      formData.append('features', JSON.stringify(features));
      formData.append('target_audience', selectedTab);

      try {
        const response = await axios.post(
          BASE_URL + 'generate-email',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        const responseData = response.data;
        const tempEmailPerTarget = _.cloneDeep(emailPerTarget);
        tempEmailPerTarget[selectedTab] = {
          mail_content: responseData.mail_content,
          mail_subject: responseData.mail_subject,
        };
        setEmailPerTarget(tempEmailPerTarget);
      } catch (e) {
        console.log('Error generating email.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSendMailDialog = async (image: string) => {
    setSelectedImage(image);
    setShowEmailModal(true);
  };

  const handleSendMail = async (event: React.FormEvent) => {
    try {
      event.preventDefault();

      const formData = new FormData();

      formData.append(
        'subject',
        emailPerTarget?.[selectedTab]?.['mail_subject'] ?? '',
      );
      formData.append(
        'body',
        emailPerTarget?.[selectedTab]?.['mail_content'] ?? '',
      );
      formData.append('image', selectedImage);
      setIsEmailSending(true);
      const response = await axios.post(BASE_URL + 'send-mail', formData);
      setIsEmailSending(false);
      setShowEmailModal(false);
      dispatchToast(
        <Toast>
          <ToastTitle>Email sent successfully.</ToastTitle>
        </Toast>,
        { position: 'top', intent: 'success' },
      );
    } catch (err) {
      console.log('Error while submitting form -- ', err);
    }
  };

  const handleCancel = (event: React.FormEvent) => {
    setShowLogoModal(false);
    setShowEmailModal(false);
  };

  return (
    <div className={styles.form}>
      {!generateButtonClicked ? (
        <div className={styles.contentContainer} style={{ margin: '20vh 0' }}>
          <Button
            className="createCampaign"
            appearance="primary"
            onClick={handleGenerateButtonClick}
          >
            Create Campaign
          </Button>
        </div>
      ) : (
        <div>
          {isLoading ? (
            <div className={styles.contentContainer}>
              <div
                className="bouncingLoader"
                style={{ marginTop: '300px !important' }}
              >
                {Array.from(message).map((ch, indx) => (
                  <span key={indx}>{ch}</span>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div>
                {/* Target Audience Tabs */}
                <div style={{ margin: '20px 0 60px 0' }}>
                  <TabList
                    selectedValue={selectedTab}
                    onTabSelect={onTabSelect}
                    appearance="filled-circular"
                    size="large"
                  >
                    {targetAudiences.map((targetAudience, idx) => (
                      <Tab key={idx} value={targetAudience} className="tab">
                        {targetAudience}
                      </Tab>
                    ))}
                  </TabList>
                </div>

                {/* Image Tabs and Image Display */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '0.3fr 3.7fr',
                    gap: '20px',
                  }}
                >
                  {/* Left Column: Image Tabs (Accepted/Rejected) */}
                  <div>
                    <TabList
                      selectedValue={selectedImageTab}
                      onTabSelect={onImageTabSelect}
                      vertical={true}
                      appearance="subtle-circular"
                    >
                      <Tab value="accepted" className="imageTab">
                        Accepted
                      </Tab>
                      <Tab value="rejected" className="imageTab">
                        Rejected
                      </Tab>
                      <Button
                        appearance="primary"
                        onClick={() => setShowLogoModal(true)}
                      >
                        Superimpose Logo
                      </Button>
                    </TabList>
                  </div>

                  {/* Right Column: Image Display */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '20px',
                      justifyContent: 'center',
                      width: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    {imagesPerTarget?.[selectedTab]?.[selectedImageTab]?.map(
                      (image, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'block',
                            maxWidth: imageResolutions[0].width,
                            boxSizing: 'border-box',
                            width: 'auto',
                            height: 'auto',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '15px',
                            }}
                          >
                            <Button
                              appearance="primary"
                              style={{
                                fontSize: '20px',
                                borderRadius: '8px 8px 0 0',
                                padding: '15px',
                                flex: '1',
                              }}
                              onClick={e => handleSendMailDialog(image)}
                            >
                              Send Email
                            </Button>
                            <Button
                              appearance="primary"
                              style={{
                                fontSize: '20px',
                                borderRadius: '8px 8px 0 0',
                                padding: '15px',
                                flex: '1',
                              }}
                              onClick={e => handleDownload(image)}
                            >
                              Download Image
                            </Button>
                          </div>
                          <Image
                            src={image}
                            width={imageResolutions[0].width}
                            height={imageResolutions[0].height}
                            alt="Image"
                            style={{
                              borderRadius: '0 0 8px 8px',
                              objectFit: 'cover',
                            }}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <Dialog modalType="modal" open={showLogoModal}>
        <DialogSurface aria-describedby={undefined}>
          <DialogBody>
            <DialogTitle>Upload Logo</DialogTitle>
            <DialogContent>
              <div style={{ marginTop: '30px', marginBottom: '50px' }}>
                <Checkbox
                  className="logoCheck"
                  checked={checked}
                  onChange={(ev, data) => setChecked(data.checked)}
                  label="Superimpose logo to rejected images as well"
                  style={{ marginTop: '13px' }}
                />
              </div>
              <div style={{ marginTop: '20px', marginBottom: '50px' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  className={styles.fileInput}
                  onChange={handleLogoUpload}
                />
                <Button
                  appearance="primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </div>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog modalType="modal" open={showEmailModal}>
        <DialogSurface aria-describedby={undefined}>
          <DialogBody>
            <DialogTitle>Send Email</DialogTitle>
            <DialogContent>
              {emailPerTarget.hasOwnProperty(selectedTab) ? (
                <div
                  style={{
                    maxWidth: '600px',
                    maxHeight: '100vh',
                    margin: '20px 0',
                  }}
                >
                  <div>
                    <Image
                      alt="Car Image"
                      shape="rounded"
                      src={selectedImage}
                      width={200}
                      height={250}
                      style={{ boxShadow: '10px 10px 5px #d9d1d0' }}
                    />
                  </div>

                  <div style={{ margin: '20px 0' }}>
                    <label htmlFor="mailSubject">
                      <strong>Subject:</strong>{' '}
                    </label>
                    <br />
                    <div>
                      {' '}
                      {emailPerTarget?.[selectedTab]?.['mail_subject'] ?? ''}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mailContent" style={{ display: 'block' }}>
                      <strong>Body: </strong>
                    </label>
                    <div>
                      {' '}
                      {emailPerTarget?.[selectedTab]?.['mail_content'] ?? ''}
                    </div>
                  </div>
                </div>
              ) : (
                <Button appearance="primary" onClick={generateEmail}>
                  Generate Email
                </Button>
              )}
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button
                  appearance="primary"
                  onClick={handleSendMail}
                  disabled={isEmailSending}
                >
                  Send
                </Button>
              </DialogTrigger>
              <DialogTrigger disableButtonEnhancement>
                <Button
                  appearance="secondary"
                  onClick={handleCancel}
                  disabled={isEmailSending}
                >
                  Cancel
                </Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <Toaster toasterId={toasterId} />
    </div>
  );
};

export default Step5;
