import React, { useContext, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Box from '@mui/material/Box';
import { AuthContext } from '../../context/Auth/AuthContext';

const AvatarUploader = ({ setAvatar, avatar, companyId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const user = useContext(AuthContext);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setAvatar(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      {!previewImage && avatar ?
        <><Avatar
          src={`${process.env.REACT_APP_BACKEND_URL}/public/company${companyId}/user/${avatar}`}
          style={{ width: 120, height: 120 }}
        /></>
        : !avatar && !previewImage ? <><Avatar
          src={`${process.env.REACT_APP_BACKEND_URL}/public/app/noimage.png`}
          style={{ width: 120, height: 120 }}
        /></> :
          <Avatar
            alt="Preview Avatar"
            src={previewImage ? previewImage : user.avatar}
            style={{ width: 120, height: 120 }}
          />
      }


      <input
        accept="image/*"
        type="file"
        id="avatar-upload"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <label htmlFor="avatar-upload" style={{ marginTop: 10 }}>
        <Button
          variant="contained"
          component="span"
          startIcon={<CloudUploadIcon />}
        >
          Upload Avatar
        </Button>
      </label>
      {/**   <p>{selectedFile ? `Selected: ${selectedFile.name}` : 'No file selected'}</p>*/}
    </Box>
  );
};

export default AvatarUploader;