import React from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { i18n } from "../../../translate/i18n";

const TaskBreadcrumbs = () => {

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ color: 'text.secondary' }}>
      <Link 
        color="inherit" 
        href="#" 
        sx={{ 
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' }
        }}
      >
        {i18n.t('breadcrumbs.applications') || 'Aplicações'}
      </Link>
      <Typography color="text.primary" sx={{ fontSize: '14px' }}>
        {i18n.t('breadcrumbs.tasks') || 'Tarefas'}
      </Typography>
    </Breadcrumbs>
  );
};

export default TaskBreadcrumbs;