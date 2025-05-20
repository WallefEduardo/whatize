import React, { useEffect, useContext } from 'react';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { AuthContext } from "../../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  '@global': {
    ul: {
      margin: 0,
      padding: 0,
      listStyle: 'none',
    },
  },

  margin: {
    margin: theme.spacing(1),
  },

  cardHeader: {
    backgroundColor:
      theme.palette.type === 'light' ? theme.palette.grey[200] : theme.palette.grey[700],
  },

  cardPricing: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: theme.spacing(2),
  },

  footer: {
    borderTop: `1px solid ${theme.palette.divider}`,
    marginTop: theme.spacing(8),
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    [theme.breakpoints.up('sm')]: {
      paddingTop: theme.spacing(6),
      paddingBottom: theme.spacing(6),
    },
  },
}));

export default function PaymentForm(props) {
  const {
    setFieldValue,
    setActiveStep,
    activeStep,
    invoiceId
  } = props;

  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const invoice = props.Invoice || {};

  useEffect(() => {
    // Quando o componente é montado, definimos o valor do plano
    // com os dados da fatura atual
    setFieldValue("plan", JSON.stringify({
      title: invoice.detail || "Plano",
      price: invoice.value || 0,
      users: invoice.users || 0,
      connections: invoice.connections || 0,
      queues: invoice.queues || 0
    }));
    
    // Apenas para depuração
    // console.log("Invoice data:", invoice);
  }, [setFieldValue, invoice]);

  return (
    <React.Fragment>
      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
          <Card>
            <CardHeader
              title={invoice.detail || "Fatura"}
              titleTypographyProps={{ align: 'center' }}
              className={classes.cardHeader}
            />
            <CardContent>
              <div className={classes.cardPricing}>
                <Typography component="h2" variant="h3" color="textPrimary">
                  R${invoice.value ? invoice.value.toLocaleString('pt-br', { minimumFractionDigits: 2 }) : "0,00"}
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  /mês
                </Typography>
              </div>
              <ul>
                <Typography component="li" variant="subtitle1" align="center">
                  {invoice.users || 0} Usuários
                </Typography>
                <Typography component="li" variant="subtitle1" align="center">
                  {invoice.connections || 0} Conexões
                </Typography>
                <Typography component="li" variant="subtitle1" align="center">
                  {invoice.queues || 0} Filas
                </Typography>
              </ul>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => {
                  setActiveStep(activeStep + 1);
                }}
              >
                CONTINUAR
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </React.Fragment>
  );
}