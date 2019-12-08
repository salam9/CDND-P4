import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')


const cert = `
-----BEGIN CERTIFICATE-----
MIIDATCCAemgAwIBAgIJCSZG3jaFhJiQMA0GCSqGSIb3DQEBCwUAMB4xHDAaBgNV
BAMTE2Rldi10b2RvMC5hdXRoMC5jb20wHhcNMTkxMjA0MjMxNjIyWhcNMzMwODEy
MjMxNjIyWjAeMRwwGgYDVQQDExNkZXYtdG9kbzAuYXV0aDAuY29tMIIBIjANBgkq
hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAypLdZzAHzK6F7bPAtt3oMvTsNDyhw1we
Y4ohSo5QA/K5Yskcy5nP2O4SNzep47YXWraVjDXT/bvjP31hySvsA8SgiW8z+f2W
rpYiIquM760u9S+z9sMv0AHhrUVfeonRqpfis/V3h+C92ilCg72oNlQGJ13yws/l
9eQFvRdSG6ixcYR5OS1x88qoVVVOYlM5HyGgFWcXTV7hSSm+LGM5IrTLpl4P5zXL
FEf9USp9CRvJJ0v4OUaVesjcwxrauRfXzSXxKwoqGpjuLpzXUloy7NStcgS3DmdH
F0DcostBiQK26B/iipw3zNLS5ONAxuwLkrR4ALe67BgAO8/EVkI79wIDAQABo0Iw
QDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBQxzB8GcEEEFYDyI/McTPh2huX2
5zAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBALuD2t0+5LpTFyFZ
i4C0hyst2Qm9YTO0nUDvWCEEhjAJdBRbQO4B72h5reojeZI/qWbYVMlO6NmdmGPn
AcfJNByJ6Ty3ufgVpmPTtjAeZFmkfAHGvgm0w/kwWCSS1mwXIUVGicHY1I3cN3LK
jz9P49/aUNrqQVn104MoIBFJeFAL5h3MfP0OzdOwWRfPH+Cg15EccBO9SEfqtiCt
TTQiOkNavQSzf48LV+MVq/GpWYinr5BuLAkn6L8LZJPLRDAd7q8XpdHprkJ6KbzT
t2DQF3SslzHkNfuOfizGRMq0uW0THE+BX0x2jV2aVwGM9fWs2Tk7+XYoHJ6fU8/g
SDpY4mA=
-----END CERTIFICATE-----
`


export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

// receives one parameter from client to api gateway
async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)

  return verify( token, cert, { algorithms: ['RS256'] } ) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}