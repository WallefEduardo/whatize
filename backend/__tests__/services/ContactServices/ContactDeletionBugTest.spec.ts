import { Sequelize, DataTypes } from "sequelize";
import Contact from "../../../src/models/Contact";
import WhatsappLidMap from "../../../src/models/WhatsappLidMap";
import DeleteContactService from "../../../src/services/ContactServices/DeleteContactService";
import CreateOrUpdateContactService from "../../../src/services/ContactServices/CreateOrUpdateContactService";

describe("Contact Deletion Bug Test", () => {
  let sequelize: Sequelize;

  beforeAll(async () => {
    // Setup test database in memory
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false
    });

    // Define Contact model manually for test
    Contact.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING,
      number: {
        type: DataTypes.STRING,
        unique: true
      },
      email: DataTypes.STRING,
      isGroup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      channel: {
        type: DataTypes.STRING,
        defaultValue: "whatsapp"
      },
      profilePicUrl: DataTypes.STRING,
      remoteJid: DataTypes.STRING,
      whatsappId: DataTypes.INTEGER
    }, { sequelize, modelName: "Contact" });

    // Define WhatsappLidMap model manually for test
    WhatsappLidMap.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      lid: {
        type: DataTypes.STRING,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    }, { sequelize, modelName: "WhatsappLidMap" });

    // Setup associations
    Contact.hasOne(WhatsappLidMap, { foreignKey: 'contactId' });
    WhatsappLidMap.belongsTo(Contact, { foreignKey: 'contactId' });

    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await WhatsappLidMap.destroy({ where: {} });
    await Contact.destroy({ where: {} });
  });

  it("should clean WhatsappLidMap when deleting contact and allow recreating contact", async () => {
    const testNumber = "5511999999999";
    const testCompanyId = 1;
    const testLid = `${testNumber}@lid`;

    // Step 1: Create initial contact
    const initialContact = await Contact.create({
      name: "Test Contact",
      number: testNumber,
      email: "",
      isGroup: false,
      companyId: testCompanyId,
      channel: "whatsapp",
      profilePicUrl: "",
      remoteJid: testNumber,
      whatsappId: 1
    });

    // Step 2: Create WhatsappLidMap entry (simulating normal flow)
    await WhatsappLidMap.create({
      lid: testLid,
      companyId: testCompanyId,
      contactId: initialContact.id
    });

    // Step 3: Verify initial setup
    const lidMapBefore = await WhatsappLidMap.findOne({
      where: { contactId: initialContact.id, companyId: testCompanyId }
    });
    expect(lidMapBefore).not.toBeNull();

    // Step 4: Delete contact using our corrected service
    await DeleteContactService(initialContact.id.toString());

    // Step 5: Verify contact is deleted
    const deletedContact = await Contact.findByPk(initialContact.id);
    expect(deletedContact).toBeNull();

    // Step 6: CRITICAL TEST - Verify WhatsappLidMap is also cleaned up
    const orphanedLidMap = await WhatsappLidMap.findOne({
      where: { contactId: initialContact.id, companyId: testCompanyId }
    });
    expect(orphanedLidMap).toBeNull(); // This should pass with our fix

    // Step 7: CRITICAL TEST - Try to create contact again (simulate new message)
    let recreatedContact;
    expect(async () => {
      recreatedContact = await Contact.create({
        name: "Test Contact Recreated",
        number: testNumber,
        email: "",
        isGroup: false,
        companyId: testCompanyId,
        channel: "whatsapp",
        profilePicUrl: "",
        remoteJid: testNumber,
        whatsappId: 1
      });
    }).not.toThrow();

    // Step 8: Verify contact was recreated successfully
    expect(recreatedContact).toBeDefined();
    expect(recreatedContact.number).toBe(testNumber);
    expect(recreatedContact.companyId).toBe(testCompanyId);

    // Step 9: Verify new WhatsappLidMap can be created for the recreated contact
    const newLidMap = await WhatsappLidMap.create({
      lid: testLid,
      companyId: testCompanyId,
      contactId: recreatedContact.id
    });
    expect(newLidMap).not.toBeNull();
    expect(newLidMap.contactId).toBe(recreatedContact.id);
  });

  it("should handle multiple contacts deletion without orphan references", async () => {
    // Create multiple contacts
    const contacts = [];
    const lidMaps = [];

    for (let i = 1; i <= 3; i++) {
      const contact = await Contact.create({
        name: `Test Contact ${i}`,
        number: `551199999999${i}`,
        email: "",
        isGroup: false,
        companyId: 1,
        channel: "whatsapp",
        profilePicUrl: "",
        remoteJid: `551199999999${i}`,
        whatsappId: 1
      });
      contacts.push(contact);

      const lidMap = await WhatsappLidMap.create({
        lid: `551199999999${i}@lid`,
        companyId: 1,
        contactId: contact.id
      });
      lidMaps.push(lidMap);
    }

    // Delete all contacts
    for (const contact of contacts) {
      await DeleteContactService(contact.id.toString());
    }

    // Verify all contacts are deleted
    for (const contact of contacts) {
      const deletedContact = await Contact.findByPk(contact.id);
      expect(deletedContact).toBeNull();
    }

    // Verify all WhatsappLidMap entries are cleaned up
    for (const contact of contacts) {
      const orphanedLidMap = await WhatsappLidMap.findOne({
        where: { contactId: contact.id, companyId: 1 }
      });
      expect(orphanedLidMap).toBeNull();
    }

    // Verify total count is zero
    const totalLidMaps = await WhatsappLidMap.count();
    expect(totalLidMaps).toBe(0);
  });
});