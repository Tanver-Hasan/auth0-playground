const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const logger = require('../../logger/logger');
const { parseStringPromise } = require('xml2js'); 
// const pako = require('pako');
// GET route to show the decoder form
router.get('/decode-jwt', (req, res) => {
  res.render('decode-jwt', {
    sampleToken: '',
    decoded: null,
    errorMessage: '',
    discoveryUrl: '',
    jwksUrl: ''
  });
});

// POST route to decode JWT and render template with results
router.post('/decode-jwt', (req, res) => {
  logger.info('Decode JWT');
  // const { token } = req.body;
  const token = (req.body.token || '').trim();


  logger.info(token)
  if (!token) {
    return res.render('decode-jwt', {
      sampleToken: '',
      decoded: null,
      errorMessage: 'Token is required',
      discoveryUrl: '',
      jwksUrl: ''
    });
  }

  try {
    const decodedToken = jwt.decode(token, { complete: true });
    logger.info(JSON.stringify(decodedToken))
    if (!decodedToken) {
      return res.render('decode-jwt', {
        sampleToken: token,
        decoded: null,
        errorMessage: 'Invalid token',
        discoveryUrl: '',
        jwksUrl: ''
      });
    }

    const iss = decodedToken?.payload?.iss || '';
    const discoveryUrl = iss ? `${iss}.well-known/openid-configuration` : '';
    const jwksUrl = iss ? `${iss}.well-known/jwks.json` : '';

    res.render('decode-jwt', {
      sampleToken: token,
      decoded: decodedToken,
      errorMessage: '',
      discoveryUrl,
      jwksUrl
    });
  } catch (error) {
    logger.error('Decoding error: ' + error.message);
    res.render('decode-jwt', {
      sampleToken: token,
      decoded: null,
      errorMessage: 'Error decoding token',
      discoveryUrl: '',
      jwksUrl: ''
    });
  }
});

router.get('/decode-saml', (req, res) => {
  res.render('decode-saml', {
    sampleSaml: '',
    xmlString: '',
    attributes: [],
    errorMessage: ''
  });
});

router.post('/decode-saml', async (req, res) => {
  const samlData = (req.body.samlRequestOrResponse || '').trim();

  logger.info('Decode SAML');

  if (!samlData || samlData.trim() === '') {
    return res.render('decode-saml', {
      sampleSaml: '',
      xmlString: '',
      attributes: [],
      errorMessage: 'Please enter a SAML request or response to decode.'
    });
  }

  try {
    let decoded = decodeSamlData(samlData);
    if (typeof decoded !== 'string' || !decoded.trim()) {
      throw new Error('Decoded data is not a valid XML string.');
    }

    const parsedXml = await parseStringPromise(decoded);
    const attributes = extractSamlAttributes(parsedXml);

    res.render('decode-saml', {
      sampleSaml: samlData,
      xmlString: formatXml(decoded),
      attributes,
      errorMessage: ''
    });
  } catch (err) {
    logger.error('SAML Decode Error: ' + err.message);
    res.render('decode-saml', {
      sampleSaml: samlData,
      xmlString: '',
      attributes: [],
      errorMessage: err.message || 'Failed to decode and parse SAML data'
    });
  }
});

function decodeSamlData(samlData) {
  let decoded = samlData;

  if (decoded.match(/%[0-9A-Fa-f]{2}/)) {
    decoded = decodeURIComponent(decoded);
  }

  if (/^[A-Za-z0-9+/=]+$/.test(decoded)) {
    decoded = Buffer.from(decoded, 'base64');
  }

  try {
    decoded = pako.inflate(decoded, { raw: true }, { to: 'string' });
  } catch (err) {
    decoded = decoded.toString('utf-8');
  }

  return decoded;
}

function extractSamlAttributes(parsedXml) {
  const attributes = [];
  const response = parsedXml['samlp:Response'];
  const assertions = response?.['saml:Assertion'];

  if (assertions?.length) {
    const attributeStatements = assertions[0]['saml:AttributeStatement'];
    const attrs = attributeStatements?.[0]?.['saml:Attribute'];
    if (attrs?.length) {
      for (const attr of attrs) {
        const name = attr['$']?.Name;
        for (const val of attr['saml:AttributeValue'] || []) {
          attributes.push({
            name,
            value: val._ || val
          });
        }
      }
    }
  }

  return attributes;
}

function formatXml(xml) {
  const tab = '  ';
  let formatted = '';
  let indent = '';
  xml.split(/>\s*</).forEach((node) => {
    if (node.match(/^\/\w/)) indent = indent.substring(tab.length);
    formatted += indent + '<' + node + '>\n';
    if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab;
  });
  return formatted.trim();
}

// Unified rendering function to prevent "undefined" errors
function renderBase64(res, overrides = {}) {
  res.render('base64', {
    sampleEncoded: '',
    decodedData: '',
    encodeInput: '',
    encodedResult: '',
    errorMessage: '',
    encodeError: '',
    ...overrides // ✅ merge overrides
  });
}

// GET page
router.get('/base64', (req, res) => {
    const sample = Buffer.from(JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
    age: 30
  })).toString('base64');

   renderBase64(res, {
    sampleEncoded: sample
  });
});

// POST decode
router.post('/decode-base64', (req, res) => {
  logger.info('Decode Base64');

  const encodedData = (req.body.encodedData || '').trim();

  if (!encodedData) {
    return renderBase64(res, {
      sampleEncoded: '', // consistent variable
      errorMessage: 'Please enter a Base64 string to decode.'
    });
  }

  try {
    const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
    renderBase64(res, {
      sampleEncoded: encodedData,
      decodedData
    });
  } catch (err) {
    logger.error('Base64 Decode Error: ' + err.message);
    renderBase64(res, {
      sampleEncoded: encodedData,
      errorMessage: 'Invalid Base64 string'
    });
  }
});

// POST encode
router.post('/encode-base64', (req, res) => {
  logger.info('Encode Base64');

  const input = (req.body.encodeInput || '').trim();

  if (!input) {
    return renderBase64(res, {
      encodeInput: '',
      encodeError: 'Please enter a string to encode.'
    });
  }

  try {
    const encodedResult = Buffer.from(input, 'utf-8').toString('base64');
    renderBase64(res, {
      encodeInput: input,
      encodedResult
    });
  } catch (err) {
    logger.error('Base64 Encode Error: ' + err.message);
    renderBase64(res, {
      encodeInput: input,
      encodeError: 'Encoding failed'
    });
  }
});

module.exports = router;
