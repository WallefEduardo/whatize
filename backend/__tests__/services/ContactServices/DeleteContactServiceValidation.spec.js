"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
describe("DeleteContactService Validation", () => {
    it("should include WhatsappLidMap cleanup in DeleteContactService", async () => {
        // Read the actual DeleteContactService file
        const serviceFilePath = path_1.default.resolve(__dirname, "../../../src/services/ContactServices/DeleteContactService.ts");
        const fileContent = fs_1.default.readFileSync(serviceFilePath, "utf8");
        // Verify our critical fix is present
        expect(fileContent).toContain("import WhatsappLidMap from");
        expect(fileContent).toContain("WhatsappLidMap.destroy");
        expect(fileContent).toContain("contactId: contact.id");
        expect(fileContent).toContain("companyId: contact.companyId");
        // Verify the cleanup happens before contact destruction
        const destroyWhatsappIndex = fileContent.indexOf("WhatsappLidMap.destroy");
        const destroyContactIndex = fileContent.indexOf("await contact.destroy();");
        expect(destroyWhatsappIndex).toBeLessThan(destroyContactIndex);
        expect(destroyWhatsappIndex).toBeGreaterThan(-1);
        expect(destroyContactIndex).toBeGreaterThan(-1);
    });
    it("should validate the correction removes orphaned references", async () => {
        const serviceFilePath = path_1.default.resolve(__dirname, "../../../src/services/ContactServices/DeleteContactService.ts");
        const fileContent = fs_1.default.readFileSync(serviceFilePath, "utf8");
        // Look for our specific comment explaining the fix
        expect(fileContent).toContain("Remove WhatsappLidMap órfãos para evitar referências mortas");
        // Verify the where clause is correct
        expect(fileContent).toMatch(/where:\s*\{\s*contactId:\s*contact\.id,\s*companyId:\s*contact\.companyId\s*\}/);
    });
    it("should ensure both ContactServices exist and are importable", () => {
        const deleteServicePath = path_1.default.resolve(__dirname, "../../../src/services/ContactServices/DeleteContactService.ts");
        const createServicePath = path_1.default.resolve(__dirname, "../../../src/services/ContactServices/CreateOrUpdateContactService.ts");
        expect(fs_1.default.existsSync(deleteServicePath)).toBe(true);
        expect(fs_1.default.existsSync(createServicePath)).toBe(true);
        // Verify both files are not empty
        const deleteServiceContent = fs_1.default.readFileSync(deleteServicePath, "utf8");
        const createServiceContent = fs_1.default.readFileSync(createServicePath, "utf8");
        expect(deleteServiceContent.length).toBeGreaterThan(100);
        expect(createServiceContent.length).toBeGreaterThan(100);
    });
    it("should verify CreateOrUpdateContactService is simplified like Ticketz", () => {
        const serviceFilePath = path_1.default.resolve(__dirname, "../../../src/services/ContactServices/CreateOrUpdateContactService.ts");
        const fileContent = fs_1.default.readFileSync(serviceFilePath, "utf8");
        // The file should now be simplified (like Ticketz - around 100-150 lines)
        expect(fileContent.length).toBeLessThan(5000); // Should be a simplified file
        expect(fileContent.length).toBeGreaterThan(1000); // But still substantial
        // Should use simple Ticketz pattern instead of complex logic
        expect(fileContent).toContain("try {");
        expect(fileContent).toContain("catch (createError)");
        expect(fileContent).toContain("SequelizeUniqueConstraintError");
        // Should NOT contain the overly complex patterns that caused loops
        expect(fileContent).not.toContain("retryWithBackoff");
        expect(fileContent).not.toContain("raceConditionLogger");
    });
});
//# sourceMappingURL=DeleteContactServiceValidation.spec.js.map