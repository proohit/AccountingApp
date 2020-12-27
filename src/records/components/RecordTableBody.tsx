import { TableBody, TableCell, TableRow } from '@material-ui/core';
import React from 'react';
import { Record } from '../models/Record';

export interface RecordTableBody {
  records: Record[];
  onRecordClicked(record: Record): void;
}
export const RecordTableBody = (props: RecordTableBody) => {
  const { records, onRecordClicked } = props;
  return (
    <TableBody>
      {records.map((record) => (
        <TableRow hover key={record.id} onClick={() => onRecordClicked(record)}>
          <TableCell>{record.description}</TableCell>
          <TableCell>{record.walletName}</TableCell>
          <TableCell>{record.category}</TableCell>
          <TableCell>{record.timestamp}</TableCell>
          <TableCell>{record.value}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
};
