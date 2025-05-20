import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Invoice from "../../models/Invoices";
import ShowInvoceService from "./ShowInvoiceService";

interface InvoiceData {
    companyId: number;
    dueDate: string;
    detail: string;
    status: string;
    value: number;
    users: number;
    connections: number;
    queues: number;
    useWhatsapp: boolean;   
    useFacebook: boolean;   
    useInstagram: boolean;   
    useCampaigns: boolean;   
    useSchedules: boolean;   
    useInternalChat: boolean;   
    useExternalApi: boolean;   
    linkInvoice: string;
}

const CreateInvoiceService = async (invoiceData: InvoiceData): Promise<Invoice> => {
   // Validação básica dos dados
   const schema = Yup.object().shape({
      companyId: Yup.number().required(),
      dueDate: Yup.string().required(),
      detail: Yup.string().required(),
      status: Yup.string().required(),
      value: Yup.number().required()
   });

   // Converter valor com vírgula para ponto se for string
   if (typeof invoiceData.value === 'string') {
      invoiceData.value = parseFloat((invoiceData.value as string).replace(',', '.'));
   }

   try {
      await schema.validate(invoiceData);
   } catch (err: any) {
      throw new AppError(err.message);
   }

   let invoice = await Invoice.create(invoiceData);
   invoice = await ShowInvoceService(invoice.id);

   return invoice;
};

export default CreateInvoiceService;
