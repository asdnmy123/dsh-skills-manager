export const CHANNEL = '/api';
export const ENDPOINT = 'dsh-skills-manager';
export const PANEL_ID = 'dsh-skills-manager';
export class ManagerError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
