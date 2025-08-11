"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Contact_1 = __importDefault(require("../../../src/models/Contact"));
const WhatsappLidMap_1 = __importDefault(require("../../../src/models/WhatsappLidMap"));
const DeleteContactService_1 = __importDefault(require("../../../src/services/ContactServices/DeleteContactService"));
describe("Contact Deletion Bug Test", () => {
    let sequelize;
    beforeAll(async () => {
        // Setup test database in memory
        sequelize = new sequelize_1.Sequelize({
            dialect: "sqlite",
            storage: ":memory:",
            logging: false
        });
        // Define Contact model manually for test
        Contact_1.default.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: sequelize_1.DataTypes.STRING,
            number: {
                type: sequelize_1.DataTypes.STRING,
                unique: true
            },
            email: sequelize_1.DataTypes.STRING,
            isGroup: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false
            },
            companyId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            channel: {
                type: sequelize_1.DataTypes.STRING,
                defaultValue: "whatsapp"
            },
            profilePicUrl: sequelize_1.DataTypes.STRING,
            remoteJid: sequelize_1.DataTypes.STRING,
            whatsappId: sequelize_1.DataTypes.INTEGER
        }, { sequelize, modelName: "Contact" });
        // Define WhatsappLidMap model manually for test
        WhatsappLidMap_1.default.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            lid: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            companyId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            },
            contactId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false
            }
        }, { sequelize, modelName: "WhatsappLidMap" });
        // Setup associations
        Contact_1.default.hasOne(WhatsappLidMap_1.default, { foreignKey: 'contactId' });
        WhatsappLidMap_1.default.belongsTo(Contact_1.default, { foreignKey: 'contactId' });
        await sequelize.sync({ force: true });
    });
    afterAll(async () => {
        await sequelize.close();
    });
    beforeEach(async () => {
        // Clean up before each test
        await WhatsappLidMap_1.default.destroy({ where: {} });
        await Contact_1.default.destroy({ where: {} });
    });
    it("should clean WhatsappLidMap when deleting contact and allow recreating contact", async () => {
        const testNumber = "5511999999999";
        const testCompanyId = 1;
        const testLid = `${testNumber}@lid`;
        // Step 1: Create initial contact
        const initialContact = await Contact_1.default.create({
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
        await WhatsappLidMap_1.default.create({
            lid: testLid,
            companyId: testCompanyId,
            contactId: initialContact.id
        });
        // Step 3: Verify initial setup
        const lidMapBefore = await WhatsappLidMap_1.default.findOne({
            where: { contactId: initialContact.id, companyId: testCompanyId }
        });
        expect(lidMapBefore).not.toBeNull();
        // Step 4: Delete contact using our corrected service
        await (0, DeleteContactService_1.default)(initialContact.id.toString());
        // Step 5: Verify contact is deleted
        const deletedContact = await Contact_1.default.findByPk(initialContact.id);
        expect(deletedContact).toBeNull();
        // Step 6: CRITICAL TEST - Verify WhatsappLidMap is also cleaned up
        const orphanedLidMap = await WhatsappLidMap_1.default.findOne({
            where: { contactId: initialContact.id, companyId: testCompanyId }
        });
        expect(orphanedLidMap).toBeNull(); // This should pass with our fix
        // Step 7: CRITICAL TEST - Try to create contact again (simulate new message)
        let recreatedContact;
        expect(async () => {
            recreatedContact = await Contact_1.default.create({
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
        const newLidMap = await WhatsappLidMap_1.default.create({
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
            const contact = await Contact_1.default.create({
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
            const lidMap = await WhatsappLidMap_1.default.create({
                lid: `551199999999${i}@lid`,
                companyId: 1,
                contactId: contact.id
            });
            lidMaps.push(lidMap);
        }
        // Delete all contacts
        for (const contact of contacts) {
            await (0, DeleteContactService_1.default)(contact.id.toString());
        }
        // Verify all contacts are deleted
        for (const contact of contacts) {
            const deletedContact = await Contact_1.default.findByPk(contact.id);
            expect(deletedContact).toBeNull();
        }
        // Verify all WhatsappLidMap entries are cleaned up
        for (const contact of contacts) {
            const orphanedLidMap = await WhatsappLidMap_1.default.findOne({
                where: { contactId: contact.id, companyId: 1 }
            });
            expect(orphanedLidMap).toBeNull();
        }
        // Verify total count is zero
        const totalLidMaps = await WhatsappLidMap_1.default.count();
        expect(totalLidMaps).toBe(0);
    });
});
//# sourceMappingURL=ContactDeletionBugTest.spec.js.map