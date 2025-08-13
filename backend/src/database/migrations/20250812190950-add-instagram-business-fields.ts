import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      // Campo para ID da conta Instagram Business
      queryInterface.addColumn("Whatsapps", "instagramBusinessAccountId", {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "ID da conta Instagram Business (nova API)"
      }),

      // Campo para access token específico do Instagram
      queryInterface.addColumn("Whatsapps", "instagramAccessToken", {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Access token para Instagram Business API"
      }),

      // Campo para username do Instagram
      queryInterface.addColumn("Whatsapps", "instagramUsername", {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Username da conta Instagram (@username)"
      }),

      // Campo para URL da foto de perfil
      queryInterface.addColumn("Whatsapps", "instagramProfilePictureUrl", {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "URL da foto de perfil do Instagram"
      }),

      // Campo para número de seguidores
      queryInterface.addColumn("Whatsapps", "instagramFollowersCount", {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "Número de seguidores no Instagram"
      }),

      // Campo para website da conta
      queryInterface.addColumn("Whatsapps", "instagramWebsite", {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Website configurado no perfil Instagram"
      }),

      // Campo para biografia
      queryInterface.addColumn("Whatsapps", "instagramBiography", {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Biografia do perfil Instagram"
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Whatsapps", "instagramBusinessAccountId"),
      queryInterface.removeColumn("Whatsapps", "instagramAccessToken"),
      queryInterface.removeColumn("Whatsapps", "instagramUsername"),
      queryInterface.removeColumn("Whatsapps", "instagramProfilePictureUrl"),
      queryInterface.removeColumn("Whatsapps", "instagramFollowersCount"),
      queryInterface.removeColumn("Whatsapps", "instagramWebsite"),
      queryInterface.removeColumn("Whatsapps", "instagramBiography")
    ]);
  }
};