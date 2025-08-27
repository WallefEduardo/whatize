/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable camelcase */
import { QueryTypes } from "sequelize";
import * as _ from "lodash";
import sequelize from "../../database";

export interface DashboardData {
  tickets: any[];
  totalTickets: any;
}

export interface Params {
  searchParam: string;
  contactId: string;
  whatsappId: string[];
  dateFrom: string;
  dateTo: string;
  status: string[];
  queueIds: number[];
  tags: number[];
  users: number[];
  userId: string;
  onlyRated: string;
}


export default async function ListTicketsServiceReport(
  companyId: string | number,
  params: Params,
  page: number = 1,
  pageSize: number = 20
): Promise<DashboardData> {
  const offset = (page - 1) * pageSize;

  const onlyRated = params.onlyRated === "true" ? true : false;
  let query = "";

  if (onlyRated) {
   query = `

  select 
	  t.id,
	  w."name" as "whatsappName",
    c."name" as "contactName",
    c."number" as "contactNumber",
	  u."name" as "userName",
	  q."name" as "queueName",
	  t."lastMessage",
    t.uuid,
    case t.status
      when 'open' then 'ABERTO'
      when 'closed' then 'FECHADO'
      when 'pending' then 'PENDENTE'
      when 'group' then 'GRUPO'
      when 'nps' then 'NPS'
      when 'lgpd' then 'LGPD'
    end as "status",
    TO_CHAR(tt."createdAt", 'DD/MM/YYYY HH24:MI') as "createdAt",
    TO_CHAR(tt."finishedAt", 'DD/MM/YYYY HH24:MI') as "closedAt",
    coalesce((
      (date_part('day', age(coalesce(tt."ratingAt", tt."finishedAt") , tt."createdAt"))) || ' d, ' || 
      (date_part('hour', age(coalesce(tt."ratingAt", tt."finishedAt"), tt."createdAt"))) || ' hrs e ' ||
      (date_part('minutes', age(coalesce(tt."ratingAt", tt."finishedAt"), tt."createdAt"))) || ' m'
    ), '0') "supportTime",
    coalesce(ur.rate, 0) "NPS",
    COALESCE(
      string_agg(DISTINCT tag."name", ', '), 
      ''
    ) as "tags",
    COALESCE(
      string_agg(DISTINCT CASE 
        WHEN tag."name" IS NOT NULL AND funil."name" IS NOT NULL 
        THEN tag."name" || ' / ' || funil."name"
        ELSE NULL 
      END, ', '), 
      ''
    ) as "etapaFunil"
  from "Tickets" t
  LEFT JOIN (
        SELECT DISTINCT ON ("ticketId") *
        FROM "TicketTraking"
        WHERE "companyId" = ${companyId}
        ORDER BY "ticketId", "id" DESC
    ) tt ON t.id = tt."ticketId"
	inner join "UserRatings" ur on
   		t.id = ur."ticketId"
       and ur.rate > 0
    left join "Contacts" c on 
      t."contactId" = c.id 
    left join "Whatsapps" w on 
      t."whatsappId" = w.id 
    left join "Users" u on
      t."userId" = u.id 
    left join "Queues" q on
      t."queueId" = q.id 
    LEFT JOIN "TicketTags" tt_tag ON t.id = tt_tag."ticketId"
    LEFT JOIN "Tags" tag ON tt_tag."tagId" = tag.id
    LEFT JOIN "FunilKanbans" funil ON tag."funilId" = funil.id
  -- filterPeriod`;
  } else {
    query = `
  select 
	  t.id,
	  w."name" as "whatsappName",
    c."name" as "contactName",
    c."number" as "contactNumber",
	  u."name" as "userName",
	  q."name" as "queueName",
	  t."lastMessage",
    t.uuid,
    case t.status
      when 'open' then 'ABERTO'
      when 'closed' then 'FECHADO'
      when 'pending' then 'PENDENTE'
      when 'group' then 'GRUPO'
      when 'nps' then 'NPS'
      when 'lgpd' then 'LGPD'
    end as "status",
    TO_CHAR(tt."createdAt", 'DD/MM/YYYY HH24:MI') as "createdAt",
    TO_CHAR(tt."finishedAt", 'DD/MM/YYYY HH24:MI') as "closedAt",
    coalesce((
      (date_part('day', age(coalesce(tt."ratingAt", tt."finishedAt") , tt."createdAt"))) || ' d, ' || 
      (date_part('hour', age(coalesce(tt."ratingAt", tt."finishedAt"), tt."createdAt"))) || ' hrs e ' ||
      (date_part('minutes', age(coalesce(tt."ratingAt", tt."finishedAt"), tt."createdAt"))) || ' m'
    ), '0') "supportTime",
    coalesce(ur.rate, 0) "NPS",
    COALESCE(
      string_agg(DISTINCT tag."name", ', '), 
      ''
    ) as "tags",
    COALESCE(
      string_agg(DISTINCT CASE 
        WHEN tag."name" IS NOT NULL AND funil."name" IS NOT NULL 
        THEN tag."name" || ' / ' || funil."name"
        ELSE NULL 
      END, ', '), 
      ''
    ) as "etapaFunil"
  from "Tickets" t
  LEFT JOIN (
        SELECT DISTINCT ON ("ticketId") *
        FROM "TicketTraking"
        WHERE "companyId" = ${companyId}
        ORDER BY "ticketId", "id" DESC
    ) tt ON t.id = tt."ticketId"
	left join "UserRatings" ur on
   		t.id = ur."ticketId"
    left join "Contacts" c on 
      t."contactId" = c.id 
    left join "Whatsapps" w on 
      t."whatsappId" = w.id 
    left join "Users" u on
      t."userId" = u.id 
    left join "Queues" q on
      t."queueId" = q.id 
    LEFT JOIN "TicketTags" tt_tag ON t.id = tt_tag."ticketId"
    LEFT JOIN "Tags" tag ON tt_tag."tagId" = tag.id
    LEFT JOIN "FunilKanbans" funil ON tag."funilId" = funil.id
  -- filterPeriod`;
  }
  let where = `where t."companyId" = ${companyId}`;

  if (_.has(params, "dateFrom")) {
    where += ` and t."createdAt" >= '${params.dateFrom} 00:00:00'`;
  }

  if (_.has(params, "dateTo")) {
    where += ` and t."createdAt" <= '${params.dateTo} 23:59:59'`;
  }

  if (params.whatsappId !== undefined && params.whatsappId.length > 0) {
    where += ` and t."whatsappId" in (${params.whatsappId})`;
  }
  if (params.users.length > 0) {
    where += ` and t."userId" in (${params.users})`;
  }

  if (params.queueIds.length > 0) {
    where += ` and COALESCE(t."queueId",0) in (${params.queueIds})`;
  }

  if (params.status.length > 0) {
    where += ` and t."status" in ('${params.status.join("','")}')`;
  }

  if (params.contactId !== undefined && params.contactId !== "") {
    where += ` and t."contactId" in (${params.contactId})`;
  } 

  if (params.onlyRated === "true") {
    query += ` and coalesce(ur.rate, 0) > 0`;
  }
  
  const finalQuery = query.replace("-- filterPeriod", where);

  // Adicionar GROUP BY para consultas com agregação
  const groupByClause = ` GROUP BY t.id, w."name", c."name", c."number", u."name", q."name", t."lastMessage", t.uuid, t.status, tt."createdAt", tt."finishedAt", tt."ratingAt", ur.rate`;
  const finalQueryWithGroupBy = finalQuery + groupByClause;

  const totalTicketsQuery = `
    SELECT COUNT(*) as total FROM "Tickets" t
    ${where}  `;

  const totalTicketsResult = await sequelize.query(totalTicketsQuery, {
    type: QueryTypes.SELECT
  });
  const totalTickets = totalTicketsResult[0];

  const paginatedQuery = `${finalQueryWithGroupBy} ORDER BY t."createdAt" DESC LIMIT ${pageSize} OFFSET ${offset}`;

  const responseData: any[] = await sequelize.query(paginatedQuery, {
    type: QueryTypes.SELECT
  });

  return { tickets: responseData, totalTickets };
}
