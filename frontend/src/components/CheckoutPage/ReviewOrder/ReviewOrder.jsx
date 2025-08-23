import React from 'react';
import { useFormikContext } from 'formik';
import { Typography, Grid, List, ListItem, ListItemText } from '@mui/material';
import useStyles from './styles';

export default function ReviewOrder({ Invoice }) {
  const { values: formValues } = useFormikContext();
  const classes = useStyles();
  
  // Verificar se temos a Invoice
  const invoice = Invoice || {};
  
  return (
    <React.Fragment>
      <Typography variant="h6" gutterBottom>
        Resumo da assinatura
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom className={classes.title}>
            Detalhes da fatura
          </Typography>
          <Typography gutterBottom>Descrição: {invoice.detail || "Assinatura"}</Typography>
          <Typography gutterBottom>Data de vencimento: {
            invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('pt-BR') : "N/A"
          }</Typography>
          <Typography gutterBottom>Status: {
            invoice.status === "pending" ? "Pendente" : 
            invoice.status === "paid" ? "Pago" : 
            invoice.status === "open" ? "Em aberto" : invoice.status || "N/A"
          }</Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom className={classes.title}>
            Detalhes do plano
          </Typography>
          <Typography gutterBottom>Usuários: {invoice.users || 0}</Typography>
          <Typography gutterBottom>Conexões: {invoice.connections || 0}</Typography>
          <Typography gutterBottom>Filas: {invoice.queues || 0}</Typography>
        </Grid>
        
        <Grid item xs={12}>
          <List disablePadding>
            <ListItem className={classes.listItem}>
              <ListItemText primary="Total" />
              <Typography variant="subtitle1" className={classes.total}>
                R$ {invoice.value ? invoice.value.toLocaleString('pt-br', { minimumFractionDigits: 2 }) : "0,00"}
              </Typography>
            </ListItem>
          </List>
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
