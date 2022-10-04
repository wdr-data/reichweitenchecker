import * as React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

export default function Contact ({ open, handleClose }) {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <DialogTitle variant='h5' component='h2' id='alert-dialog-title'>
        Kontakt
        <IconButton
          aria-label='Schließen'
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme => theme.palette.primary.dark
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id='alert-dialog-description' component='div'>
          <Typography>
            Wenn Sie Fragen zum Reichweiten-Checker oder Fehler gefunden haben,
            freuen wir uns über eine Mail an{' '}
            <Link href='mailto:newsroom-stories@wdr.de'>
              newsroom-stories@wdr.de
            </Link>
            . Weitere Kontaktmöglichkeiten zu den Redaktionen des WDR finden Sie
            hier:{' '}
            <Link href='https://www1.wdr.de/kontakt/index.html'>
              https://www1.wdr.de/kontakt/index.html
            </Link>
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant='contained'>
          Schließen
        </Button>
      </DialogActions>
    </Dialog>
  )
}
