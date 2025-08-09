import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("WhatsappLidMaps", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      lid: {
        type: DataTypes.STRING,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }).then(async () => {
      await queryInterface.addIndex("WhatsappLidMaps", ["companyId"], {
        name: "idx_whatsapp_lid_maps_company"
      });
      await queryInterface.addIndex("WhatsappLidMaps", ["contactId"], {
        name: "idx_whatsapp_lid_maps_contact"
      });
      // ✅ Alinhar com ticketz: unique (lid, companyId)
      await queryInterface.addConstraint("WhatsappLidMaps", ["lid", "companyId"], {
        type: "unique",
        name: "unique_lid_companyId"
      });
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("WhatsappLidMaps");
  }
};