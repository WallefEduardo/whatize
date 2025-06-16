import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const settingsExist = await queryInterface.rawSelect('CompaniesSettings', {
      where: {
        companyId: 1,
      },
    }, ['companyId']);

    if (!settingsExist) {
      return queryInterface.bulkInsert("CompaniesSettings",
        [
          {
            companyId: 1,
            hoursCloseTicketsAuto: "9999999999",
            chatBotType: "text",
            acceptCallWhatsapp: "disabled",
            userRandom: "disabled",
            sendGreetingMessageOneQueues: "disabled",
            sendSignMessage: "disabled",
            sendFarewellWaitingTicket: "disabled",
            userRating: "disabled",
            sendGreetingAccepted: "disabled",
            CheckMsgIsGroup: "disabled",
            sendQueuePosition: "disabled",
            scheduleType: "disabled",
            acceptAudioMessageContact: "disabled",
            sendMsgTransfTicket: "disabled",
            enableLGPD: "disabled",
            requiredTag: "disabled",
            lgpdDeleteMessage: "disabled",
            lgpdHideNumber: "disabled",
            lgpdConsent: "disabled",
            lgpdLink: "",
            lgpdMessage: "",
            createdAt: new Date(),
            updatedAt: new Date(),
            DirectTicketsToWallets: false,
            closeTicketOnTransfer: false
          }
        ],
        {}
      );
    }
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.bulkDelete("CompaniesSettings", { companyId: 1 });
  }
};
