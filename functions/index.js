/**
 * Cloud Function: buscarRuc
 * Proxy para consulta de RUC en SUNAT via decolecta.com
 * Evita CORS al hacer la llamada desde el servidor de Firebase
 */

const { setGlobalOptions } = require('firebase-functions')
const { onRequest } = require('firebase-functions/https')
const { defineSecret } = require('firebase-functions/params')
const logger = require('firebase-functions/logger')
const https = require('https')

setGlobalOptions({ maxInstances: 10, region: 'us-central1' })

// Token guardado como secret de Firebase (no expuesto en el código)
const sunatToken = defineSecret('SUNAT_TOKEN')

/**
 * GET /buscarRuc?ruc=20100211387
 * Retorna la razón social del RUC consultado
 */
exports.buscarRuc = onRequest(
  { secrets: [sunatToken] },
  (req, res) => {
    // CORS: permitir llamadas desde cualquier origen (el frontend en Render)
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    const ruc = req.query.ruc
    if (!ruc || ruc.length !== 11) {
      res.status(400).json({ error: 'RUC inválido' })
      return
    }

    const token = sunatToken.value()
    const options = {
      hostname: 'api.decolecta.com',
      path: `/v1/sunat/ruc?numero=${ruc}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    }

    const request = https.request(options, (response) => {
      let data = ''
      response.on('data', (chunk) => { data += chunk })
      response.on('end', () => {
        if (response.statusCode === 200) {
          try {
            const parsed = JSON.parse(data)
            res.status(200).json(parsed)
          } catch (e) {
            res.status(500).json({ error: 'Error al parsear respuesta de SUNAT' })
          }
        } else {
          logger.warn('SUNAT API error', { statusCode: response.statusCode, ruc })
          res.status(response.statusCode).json({ error: 'RUC no encontrado' })
        }
      })
    })

    request.on('error', (e) => {
      logger.error('Error conectando a decolecta.com', e)
      res.status(500).json({ error: 'Error al conectar con SUNAT' })
    })

    request.end()
  }
)
