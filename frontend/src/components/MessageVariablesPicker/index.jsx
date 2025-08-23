import React from "react";
import { Chip } from "@mui/material";
import { i18n } from "../../translate/i18n";
import OutlinedDiv from "../OutlinedDiv";

const MessageVariablesPicker = ({ onClick, disabled }) => {

    const handleClick = (e, value) => {
        e.preventDefault();
        if (disabled) return;
        onClick(value);
    };

    const msgVars = [
        {
            name: i18n.t("messageVariablesPicker.vars.contactFirstName"),
            value: "{{firstName}}"
        },
        {
            name: i18n.t("messageVariablesPicker.vars.contactName"),
            value: "{{name}} "
        },
        {
            name: i18n.t("messageVariablesPicker.vars.user"),
            value: "{{userName}} "
        },
        {
            name: i18n.t("messageVariablesPicker.vars.greeting"),
            value: "{{ms}} "
        },
        {
            name: i18n.t("messageVariablesPicker.vars.protocolNumber"),
            value: "{{protocol}} "
        },
        {
            name: i18n.t("messageVariablesPicker.vars.date"),
            value: "{{date}} "
        },
        {
            name: i18n.t("messageVariablesPicker.vars.hour"),
            value: "{{hour}} "
        },
        {
            name: i18n.t("messageVariablesPicker.vars.ticket_id"),
            value: "{{ticket_id}} "
        },
        {
            name: i18n.t("messageVariablesPicker.vars.queue"),
            value: "{{queue}} "
        },
        {
            name: i18n.t("messageVariablesPicker.vars.connection"),
            value: "{{connection}} "
        }
    ];

    return (
        <OutlinedDiv
            margin="dense"
            fullWidth
            label={i18n.t("messageVariablesPicker.label")}
            disabled={disabled}
        >
            {msgVars.map(msgVar => (
                <Chip
                    key={msgVar.value}
                    onMouseDown={e => handleClick(e, msgVar.value)}
                    label={msgVar.name}
                    size="small"
                    sx={{
                        margin: (theme) => 4,
                        cursor: "pointer"
                    }}
                    color="primary"
                />
            ))}
        </OutlinedDiv>
    );
};

export default MessageVariablesPicker;