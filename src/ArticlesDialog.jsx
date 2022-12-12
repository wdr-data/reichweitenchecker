import * as React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import { Card, CardContent, CardMedia, Stack } from '@mui/material'

import styles from './ArticlesDialog.module.scss'

import imageAutoVsOepnv from './img/auto-vs-oepnv.jpg'
import imageHaltestelleBusEinsam from './img/haltestelle-bus-einsam.jpg'

export default function ArticlesDialog ({ open, handleClose }) {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <DialogTitle variant='h5' component='h2' id='alert-dialog-title'>
        Mehr zum Thema
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
        <Stack spacing={2}>
          <Link
            href='https://www1.wdr.de/nachrichten/oepnv-nrw-bus-bahn-auto-erreichbarkeit-100.html'
            className={styles.linkCard}
            title='Noch gewinnt das Auto: Wie Bus und Bahn in NRW schneller werden sollen'
          >
            <Card>
              <CardMedia component='img' image={imageAutoVsOepnv} alt='' />
              <CardContent>
                <Typography variant='h6'>
                  Noch gewinnt das Auto: Wie Bus und Bahn in NRW schneller
                  werden sollen
                </Typography>
                <Typography>
                  Wenn man in NRW zentrale Orte erreichen möchte, geht das
                  überall mit dem Auto deutlich schneller als mit Bus und Bahn.
                  Das zeigt unsere Erreichbarkeits-Karte. Verkehrsexperten
                  wollen das ändern - mit teils ungewöhnlichen Ideen.
                </Typography>
              </CardContent>
              <div></div>
            </Card>
          </Link>
          <Link
            href='https://www1.wdr.de/nachrichten/oepnv-nrw-reichweite-verkehr-bus-bahn-100.html'
            className={styles.linkCard}
            title='Preis ist nicht alles: Wie gut ist NRW angebunden?'
          >
            <Card>
              <CardMedia
                component='img'
                image={imageHaltestelleBusEinsam}
                alt=''
              />
              <CardContent>
                <Typography variant='h6'>
                  Preis ist nicht alles: Wie gut ist NRW angebunden?
                </Typography>
                <Typography>
                  Wer auf dem Land lebt, ist meist nicht gut an Bus und Bahn
                  angebunden. Aber: Es gibt auch Ausnahmen. Von welchen
                  Konzepten ganz NRW lernen kann.
                </Typography>
              </CardContent>
              <div></div>
            </Card>
          </Link>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant='contained'>
          Schließen
        </Button>
      </DialogActions>
    </Dialog>
  )
}
