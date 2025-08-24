import { QueryTypes } from "sequelize";
import sequelize from "../../database";

type Result = {
  id: number;
  currentSchedule: [];
  startTimeA: string;
  endTimeA: string;
  startTimeB: string;
  endTimeB: string;
  inActivity: boolean;
};

const VerifyCurrentSchedule = async (companyId?: number, queueId?: number, whatsappId?: number): Promise<Result> => {
  // Validação de parâmetros obrigatórios
  if (!companyId) {
    throw new Error("companyId é obrigatório");
  }

  // Converte parâmetros para números, tratando valores nulos/undefined
  const numWhatsappId = Number(whatsappId) || 0;
  const numQueueId = Number(queueId) || 0;

  // Verifica se é para buscar por whatsapp (whatsappId > 0 e queueId = 0)
  if (numWhatsappId > 0 && numQueueId === 0) {
    const sql = `
        select
        s.id,
        s.currentWeekday,
        s.currentSchedule,
          (s.currentSchedule->>'startTimeA') "startTimeA",
          (s.currentSchedule->>'endTimeA') "endTimeA",
          (s.currentSchedule->>'startTimeB') "startTimeB",
          (s.currentSchedule->>'endTimeB') "endTimeB",
          ( (
            case 
            	when s.currentSchedule->>'startTimeA' = '' then now()::time >= '00:00'::time
    			ELSE now()::time >= (s.currentSchedule->>'startTimeA')::time	
            end
 			) and (
            case 
            	when s.currentSchedule->>'endTimeA' = ''then now()::time <= '00:00'::time
    			ELSE now()::time <= (s.currentSchedule->>'endTimeA')::time	
            end ) ) or ( (
            case 
            	when s.currentSchedule->>'startTimeB' = ''then now()::time >= '00:00'::time
    			ELSE now()::time >= (s.currentSchedule->>'startTimeB')::time	
            end
 			) and (
            case 
            	when s.currentSchedule->>'endTimeB' = ''then now()::time <= '00:00'::time
    			ELSE now()::time <= (s.currentSchedule->>'endTimeB')::time	
            end 
          )) "inActivity"
      from (
        SELECT
              c.id,
              to_char(current_date, 'day') currentWeekday,
              (array_to_json(array_agg(s))->>0)::jsonb currentSchedule
        FROM "Whatsapps" c, jsonb_array_elements(c.schedules) s
        WHERE s->>'weekdayEn' like trim(to_char(current_date, 'day')) and c.id = :whatsappId
        and c."companyId" = :companyId
        GROUP BY 1, 2
      ) s      
    `;

    const result: Result = await sequelize.query(sql, {
      replacements: { whatsappId: numWhatsappId, companyId },
      type: QueryTypes.SELECT,
      plain: true
    });

    return result;
  }
  // Verifica se é para buscar por empresa (queueId = 0 e whatsappId = 0)
  else if (numQueueId === 0 && numWhatsappId === 0) {
    const sql = `
        select
        s.id,
        s.currentWeekday,
        s.currentSchedule,
          (s.currentSchedule->>'startTimeA') "startTimeA",
          (s.currentSchedule->>'endTimeA') "endTimeA",
          (s.currentSchedule->>'startTimeB') "startTimeB",
          (s.currentSchedule->>'endTimeB') "endTimeB",
          ( (
            case 
            	when s.currentSchedule->>'startTimeA' = '' then now()::time >= '00:00'::time
    			ELSE now()::time >= (s.currentSchedule->>'startTimeA')::time	
            end
 			) and (
            case 
            	when s.currentSchedule->>'endTimeA' = ''then now()::time <= '00:00'::time
    			ELSE now()::time <= (s.currentSchedule->>'endTimeA')::time	
            end ) ) or ( (
            case 
            	when s.currentSchedule->>'startTimeB' = ''then now()::time >= '00:00'::time
    			ELSE now()::time >= (s.currentSchedule->>'startTimeB')::time	
            end
 			) and (
            case 
            	when s.currentSchedule->>'endTimeB' = ''then now()::time <= '00:00'::time
    			ELSE now()::time <= (s.currentSchedule->>'endTimeB')::time	
            end 
          )) "inActivity"
      from (
        SELECT
              c.id,
              to_char(current_date, 'day') currentWeekday,
              (array_to_json(array_agg(s))->>0)::jsonb currentSchedule
        FROM "Companies" c, jsonb_array_elements(c.schedules) s
        WHERE s->>'weekdayEn' like trim(to_char(current_date, 'day')) and c.id = :companyId
        GROUP BY 1, 2
      ) s      
    `;

    const result: Result = await sequelize.query(sql, {
      replacements: { companyId },
      type: QueryTypes.SELECT,
      plain: true
    });

    return result;
  } 
  // Caso contrário, busca por fila (queueId > 0)
  else {
    // Valida se queueId foi fornecido
    if (numQueueId <= 0) {
      throw new Error("queueId deve ser maior que 0 quando não é busca por empresa ou whatsapp");
    }
    const sql = `
      select
        s.id,
        s.currentWeekday,
        s.currentSchedule,
          (s.currentSchedule->>'startTimeA') "startTimeA",
          (s.currentSchedule->>'endTimeA') "endTimeA",
          (s.currentSchedule->>'startTimeB') "startTimeB",
          (s.currentSchedule->>'endTimeB') "endTimeB",
          COALESCE(( (
            case 
            	when s.currentSchedule->>'startTimeA' = '' then now()::time >= '00:00'::time
    			ELSE now()::time >= (s.currentSchedule->>'startTimeA')::time	
            end
 			) and (
            case 
            	when s.currentSchedule->>'endTimeA' = ''then now()::time <= '00:00'::time
    			ELSE now()::time <= (s.currentSchedule->>'endTimeA')::time	
            end ) ) or ( (
            case 
            	when s.currentSchedule->>'startTimeB' = ''then now()::time >= '00:00'::time
    			ELSE now()::time >= (s.currentSchedule->>'startTimeB')::time	
            end
 			) and (
            case 
            	when s.currentSchedule->>'endTimeB' = ''then now()::time <= '00:00'::time
    			ELSE now()::time <= (s.currentSchedule->>'endTimeB')::time	
            end 
          )),false)  "inActivity"
      from (
        SELECT
              q.id,
              to_char(current_date, 'day') currentWeekday,
              (array_to_json(array_agg(s))->>0)::jsonb currentSchedule
        FROM "Queues" q, jsonb_array_elements(q.schedules) s
        WHERE s->>'weekdayEn' like trim(to_char(current_date, 'day')) and q.id = :queueId
        and q."companyId" = :companyId
        GROUP BY 1, 2
      ) s     
    `;

    const result: Result = await sequelize.query(sql, {
      replacements: { queueId: numQueueId, companyId },
      type: QueryTypes.SELECT,
      plain: true
    });

    return result;
  }
};

export default VerifyCurrentSchedule;
