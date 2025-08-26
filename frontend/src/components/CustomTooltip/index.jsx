import React from 'react';
import { Tooltip } from '@mui/material';

const CustomTooltip = ({ children, title, ...props }) => {
  return (
    <Tooltip
      title={title}
      arrow
      placement="top"
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.8) !important',
            color: '#ffffff !important',
            border: '1px solid #333',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            maxWidth: 400,
            fontSize: '0.875rem'
          }
        },
        arrow: {
          sx: {
            color: 'rgba(0, 0, 0, 0.8) !important',
            '&::before': {
              backgroundColor: 'rgba(0, 0, 0, 0.8) !important',
              border: '1px solid #333'
            }
          }
        }
      }}
      {...props}
    >
      {children}
    </Tooltip>
  );
};

export default CustomTooltip;