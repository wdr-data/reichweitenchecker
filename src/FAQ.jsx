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

export default function FAQ ({ open, handleClose }) {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <DialogTitle variant='h5' component='h2' id='alert-dialog-title'>
        Der Reichweiten-Checker by WDR aktuell
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
          <Typography variant='h6' component='h3'>
            Was sehe ich hier?
          </Typography>

          <Typography>
            In diesem Dashboard wird dargestellt, wie gut die Haltestellen von
            öffentlichen Verkehrsmitteln in NRW angebunden sind. Zum einen gibt
            es Daten zu jeder Station: Wie viele Abfahrten gibt es tagsüber pro
            Stunde, welche Verkehrsmittel fahren an der Haltestelle?
          </Typography>

          <Typography>
            Außerdem wird gezeigt, wie viele Abfahrten es in jeder Stunde an
            jedem Wochentag gibt. Dazu gibt es eine Grafik, in der es für jede
            Stunde an jedem Wochentag ein eingefärbtes Feld gibt. Je dunkler das
            Feld ist, desto mehr Abfahrten gibt es in dieser Stunde. Die genaue
            Zahl sieht man, wenn man die jeweilige Stunde antippt/anklickt.
          </Typography>

          <Typography>
            In der Karte sind alle Haltestellen abgebildet, die von der
            jeweiligen Haltestelle aus in einer Stunde Fahrtzeit erreichbar
            sind.
          </Typography>

          <Typography variant='h6' component='h3'>
            Einstellungen
          </Typography>

          <Typography>
            Die Anzeige kann an zwei Stellen verändert werden: Die Daten können
            für unterschiedliche Tage angezeigt werden, dazu gibt es ganz oben
            die Buttons für Werktag/Samstag/Sonntag.
          </Typography>

          <Typography>
            Außerdem kann in der Kartenansicht eingestellt werden, ob Fahrziele
            angezeigt werden, die mit oder ohne Umstieg erreichbar sind.
          </Typography>

          <Typography variant='h6' component='h3'>
            Woher kommen die Daten?
          </Typography>

          <Typography>
            Wir haben für diese Darstellungen Fahrplandaten für NRW ausgewertet,
            die der Verein DELFI, ein Kooperationsnetzwerk aller Bundesländer,
            des Bundes und vieler Verkehrsverbünde, online zur Verfügung stellt.
            Um die Datenmenge handhaben zu können, haben wir für die
            Auswertungen die Woche vom 12. bis zum 19. September zugrundegelegt.
            Zahlen für Werktage sind also Durchschnittswerte für den 12. bis 17.
            September, Zahlen für samstags beziehen sich auf den 18. September
            und für sonntags auf den 19. September 2022. Die Daten beinhalten
            sowohl Nah- als auch Fernverkehr.
          </Typography>

          <Typography variant='h6' component='h3'>
            Wie kommt die Karte zustande?
          </Typography>

          <Typography>
            Für die Kartendarstellung haben wir den sogenannten
            RAPTOR-Algorithmus verwendet - ein Computerprogramm, das aus
            strukturierten Fahrplandaten die kürzeste Verbindung zu anderen
            Haltestellen berechnen kann. Für die Werktage haben wir die
            Verbindungen für ein Zeitfenster an einem Montag berechnet, bei
            einer Abfahrt zwischen 6 und 10 Uhr und einer maximalen Reisedauer
            von 60 Minuten. Für Samstag und Sonntag wurden als Zeitfenster für
            die Abfahrt 10 bis 14 Uhr gewählt.
          </Typography>

          <Typography>
            Der verwendete Algorithmus geht davon aus, dass zwischen Stationen
            nicht gelaufen wird, es werden also nur Verbindungen ausgegeben, bei
            denen maximal innerhalb einer einzelnen Haltestelle von einem Gleis
            zum anderen gelaufen wird. Das kann dazu führen, dass für nah
            beieinander liegende Haltestellen (z.B. Köln/Dom und Köln/Hbf) lange
            Reisezeiten angezeigtwerden, obwohl sie zu Fuß in wenigen Minuten
            erreichbar wären. Ein manuelles “Finetuning” einzelner Verbindungen
            war bei der großen Menge an Daten aber leider nicht möglich.
          </Typography>

          <Typography variant='h6' component='h3'>
            Ich kann meine Haltestelle nicht finden!
          </Typography>

          <Typography>
            Unsere Auswertung umfasst fast 47.000 Haltestellen in NRW - alle
            Stationen in NRW, für die im DELFI-Datensatz Fahrplandaten
            vorliegen. Die Namen der Haltestellen haben wir dem Datensatz direkt
            entnommen - möglicherweise heißt die Haltestelle im offiziellen
            Datensatz anders, als sie allgemein genannt wird (z.B. heißt der
            Bahnhof “Leverkusen Mitte” offiziell “Leverkusen Wiesdorf Mitte
            Bf”). Über eine Kombination aus dem Ort und dem Haltestellennamen
            sollten die Stationen aber in der Regel gut auffindbar sein.
          </Typography>

          <Typography variant='h6' component='h3'>
            Ich habe einen Fehler gefunden!
          </Typography>

          <Typography>
            Wir haben uns große Mühe gegeben, die Daten genau und zutreffend
            auszuwerten - bei knapp 47.000 Haltestellen konnten wir aber nicht
            alle Ergebnisse händisch überprüfen. Falls Ihnen also eine
            Haltestelle auffällt, bei der Sie das Ergebnis für völlig
            unrealistisch halten, sagen Sie uns gerne Bescheid, dann prüfen wir
            das nach. Schreiben Sie einfach eine Mail an{' '}
            <Link href='mailto:newsroom-stories@wdr.de'>
              newsroom-stories@wdr.de
            </Link>
            .
          </Typography>

          <Typography variant='h6' component='h3'>
            Datenschutz
          </Typography>

          <Typography>
            Für dieses Angebot gilt die{' '}
            <Link href='https://www1.wdr.de/hilfe/datenschutz102.html'>
              Datenschutzerklärung des WDR
            </Link>
            .
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant='contained'>
          Alles klar!
        </Button>
      </DialogActions>
    </Dialog>
  )
}
