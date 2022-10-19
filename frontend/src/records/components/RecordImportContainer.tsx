import { Delete, Remove } from '@mui/icons-material';
import {
  Button,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Radio,
  RadioGroup,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import React from 'react';
import { useSetRecoilState } from 'recoil';
import { notificationState } from '../../shared/hooks/notificationState';
import { useWalletsQuery } from '../../wallets/hooks/walletsQueries';
import { WalletUtils } from '../../wallets/utils/walletUtils';
import { useCategoriesQuery } from '../hooks/categoriesQueries';
import { importRecordDialogState } from '../hooks/recordsDialogsState';
import { useCreateManyRecordsMutation } from '../hooks/recordsQueries';
import { Record } from '../models/Record';
import { createNewRecordsFromMt940File } from '../services/ImportService';
import { RecordsApiService } from '../services/RecordsApi';
import { getCategoryById, getCategoryByName } from '../utils/categoryUtils';
import { CategoryField } from './CategoryField';
import { DescriptionField } from './DescriptionField';
import { RecordSchema } from './RecordForm';
import { RecordsTable } from './RecordsTable';
import { RecordTableHeader } from './RecordTableHeader';
import { WalletField } from './WalletField';

const RecordImportContainer: React.FC = (props) => {
  const [importType, setImportType] = React.useState('mt940');
  const { data: categories } = useCategoriesQuery();
  const { data: wallets } = useWalletsQuery();
  const { mutateAsync: createManyRecords, isLoading: importLoading } =
    useCreateManyRecordsMutation();
  const { values, handleSubmit, handleChange, setValues } = useFormik<{
    newRecords: Record[];
  }>({
    initialValues: {
      newRecords: [],
    },
    validationSchema: RecordSchema(wallets?.map((wallet) => wallet.name)),
    validateOnChange: true,
    onSubmit: (submittedValues) => {
      console.log(submittedValues);
      importRecords(submittedValues.newRecords);
    },
  });
  const setNotificationState = useSetRecoilState(notificationState);
  const setImportRecordDialog = useSetRecoilState(importRecordDialogState);

  const api = new RecordsApiService();

  const handleImportTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setImportType((event.target as HTMLInputElement).value);
  };

  const importRecords = async (newRecords: Record[]) => {
    try {
      await createManyRecords(newRecords);
      setNotificationState({
        content: 'Records imported successfully',
        severity: 'success',
      });
      setImportRecordDialog({ open: false });
    } catch (error) {
      setNotificationState({
        content: 'Error while importing records',
        severity: 'error',
      });
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const recordsFromFile = await createNewRecordsFromMt940File(
        file,
        wallets[0].id,
        categories[0].id
      );
      const existingRecords = await api.checkIfExternalReferencesExist(
        recordsFromFile
      );
      const newRecords = recordsFromFile.filter(
        (record) =>
          !existingRecords.some(
            (r) => r.externalReference === record.externalReference
          )
      );
      setValues({ newRecords });
      event.target.value = '';
      if (existingRecords.length > 0) {
        setNotificationState({
          content: `Some records have already been imported. They will not be imported again.`,
          severity: 'info',
        });
      }
    }
  };

  const updateNewRecordWithCategory = (categoryName: string, index: number) => {
    const category = getCategoryByName(categories, categoryName);
    if (category) {
      const updatedRecords = [...values.newRecords];
      updatedRecords[index].categoryId = category.id;
      setValues({ newRecords: updatedRecords });
    }
  };

  const updateNewRecordWithWallet = (walletName: string, index: number) => {
    const wallet = WalletUtils.getWalletByName(wallets, walletName);
    if (wallet) {
      const updatedRecords = [...values.newRecords];
      updatedRecords[index].walletId = wallet.id;
      setValues({ newRecords: updatedRecords });
    }
  };

  const showNewRecords = values.newRecords.length > 0 && categories && wallets;

  const removeRecord = (index) => {
    const updatedRecords = [...values.newRecords];
    updatedRecords.splice(index, 1);
    setValues({ newRecords: updatedRecords });
  };

  return (
    <Grid container spacing={2} direction="column">
      <Grid item container direction="row" xs>
        <RadioGroup
          aria-label="import-choice"
          value={importType}
          onChange={handleImportTypeChange}
        >
          <FormControlLabel
            disabled={importLoading}
            value="mt940"
            control={<Radio />}
            label="MT940"
          />
        </RadioGroup>
        <Button disabled={importLoading} variant="contained" component="label">
          Upload File
          <input type="file" hidden onChange={handleFileUpload} />
        </Button>
      </Grid>
      <Grid item xs>
        <Typography variant="h6">Import editor</Typography>
        {showNewRecords && (
          <form onSubmit={handleSubmit} id="import-form">
            <RecordsTable>
              <RecordTableHeader>
                <TableCell key="actions" />
              </RecordTableHeader>
              <TableBody>
                {values.newRecords.map((record, index) => (
                  <TableRow key={record.externalReference}>
                    <TableCell>
                      <DescriptionField
                        multiline
                        description={record.description}
                        onDescriptionChange={handleChange}
                        namePrefix={`newRecords[${index}].`}
                      />
                    </TableCell>
                    <TableCell>
                      <CategoryField
                        categories={categories}
                        categoryName={
                          getCategoryById(categories, record.categoryId)?.name
                        }
                        onCategoryChange={(categoryName) =>
                          updateNewRecordWithCategory(categoryName, index)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <WalletField
                        wallets={wallets}
                        walletName={
                          WalletUtils.getWalletById(wallets, record.walletId)
                            ?.name
                        }
                        onWalletChange={(event) =>
                          updateNewRecordWithWallet(event.target.value, index)
                        }
                      />
                    </TableCell>
                    <TableCell>{record.timestamp}</TableCell>
                    <TableCell>{record.value}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => removeRecord(index)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </RecordsTable>
          </form>
        )}
      </Grid>
      <Divider />
      <Grid item xs>
        {importLoading && <LinearProgress />}
        <Button
          disabled={importLoading}
          onClick={() => setImportRecordDialog({ open: false })}
        >
          Cancel
        </Button>
        <Button
          disabled={importLoading}
          onClick={() => importRecords(values.newRecords)}
        >
          Import
        </Button>
      </Grid>
    </Grid>
  );
};

export default RecordImportContainer;
