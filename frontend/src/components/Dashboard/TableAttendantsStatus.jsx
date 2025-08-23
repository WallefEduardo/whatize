import React from "react";

import Paper from "@mui/material/Paper";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from "@mui/material/Skeleton";

import { green, grey } from '@mui/material/colors';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import moment from 'moment';

import Rating from '@mui/material/Rating';
import { i18n } from "../../translate/i18n";

export function RatingBox({ rating }) {
    const ratingTrunc = rating === null ? 0 : Math.trunc(rating);
    return <Rating
        defaultValue={ratingTrunc}
        max={3}
        readOnly
    />
}

export default function TableAttendantsStatus(props) {
    const { loading, attendants } = props;

    function renderList() {
        return attendants.map((a, k) => (
            <TableRow key={k}>
                <TableCell>{a.name}</TableCell>
                {/* <TableCell align="center" title="1 - Insatisfeito, 2 - Satisfeito, 3 - Muito Satisfeito" className={classes.pointer}>
                    <RatingBox rating={a.rating} />
                </TableCell> */}
                <TableCell align="center">{a.rating}</TableCell>
                <TableCell align="center">{a.countRating}</TableCell>
                <TableCell align="center">{a.tickets}</TableCell>
                <TableCell align="center">{formatTime(a.avgWaitTime, 2)}</TableCell>
                <TableCell align="center">{formatTime(a.avgSupportTime, 2)}</TableCell>
                <TableCell align="center">
                    {a.online ?
                        <Tooltip title="Online">
                            <CheckCircleIcon sx={{ color: green[600], fontSize: '20px' }} />
                        </Tooltip>
                        :
                        <Tooltip title="Offline">
                            <ErrorIcon sx={{ color: grey[600], fontSize: '20px' }} />
                        </Tooltip>
                    }
                </TableCell>
            </TableRow>
        ))
    }

    function formatTime(minutes) {
        return moment().startOf('day').add(minutes, 'minutes').format('HH[h] mm[m]');
    }

    return (!loading ?
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{i18n.t("dashboard.users.name")}</TableCell>
                        <TableCell align="center">{i18n.t("dashboard.assessments.score")}</TableCell>
                        <TableCell align="center">{i18n.t("dashboard.assessments.ratedCalls")}</TableCell>
                        <TableCell align="center">{i18n.t("dashboard.assessments.totalCalls")}</TableCell>
                        <TableCell align="center">{i18n.t("dashboard.cards.averageWaitingTime")}</TableCell>
                        <TableCell align="center">{i18n.t("dashboard.cards.averageServiceTime")}</TableCell>
                        <TableCell align="center">{i18n.t("dashboard.cards.status")}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {renderList()}
                </TableBody>
            </Table>
        </TableContainer>
        : <Skeleton variant="rect" height={150} />
    )
}