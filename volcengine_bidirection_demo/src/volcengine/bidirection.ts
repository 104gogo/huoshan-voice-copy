import { Command } from 'commander'
import * as fs from 'fs'
import WebSocket from 'ws'
import * as uuid from 'uuid'
import {
  MsgType,
  ReceiveMessage,
  EventType,
  StartConnection,
  StartSession,
  TaskRequest,
  FinishSession,
  FinishConnection,
  WaitForEvent,
} from '../protocols'

const program = new Command()

function VoiceToResourceId(voice: string): string {
  if (voice.startsWith('S_')) {
    return 'volc.megatts.default'
  }
  return 'volc.service_type.10029'
}

program
  .name('bidirection')
  .option('--appid <appid>', 'appid', '填入你的appid')
  .option('--access_token <access_token>', 'access key', '填入你的access_token')
  .option('--resource_id <resource_id>', 'resource id', '')
  .option('--voice_type <voice>', 'voice_type', '填入你的voice_type')
  .option('--text <text>', 'text', '字节跳动语音合成')
  .option('--encoding <encoding>', 'encoding format', 'mp3')
  .option(
    '--endpoint <endpoint>',
    'websocket endpoint',
    'wss://openspeech.bytedance.com/api/v3/tts/bidirection',
  )
  .action(async (options) => {
    console.log('options: ', options)

    const headers = {
      'X-Api-App-Key': options.appid,
      'X-Api-Access-Key': options.access_token,
      'X-Api-Resource-Id':
        (options.resource_id && options.resource_id.trim()) ||
        VoiceToResourceId(options.voice_type),
      'X-Api-Connect-Id': uuid.v4(),
    }

    console.log('headers: ', headers)

    const ws = new WebSocket(options.endpoint, {
      headers,
      skipUTF8Validation: true,
    })

    await new Promise((resolve, reject) => {
      ws.on('open', resolve)
      ws.on('error', reject)
    })

    await StartConnection(ws)

    console.log(
      `${await WaitForEvent(
        ws,
        MsgType.FullServerResponse,
        EventType.ConnectionStarted,
      ).then((msg) => msg.toString())}`,
    )

    const requestTemplate = {
      user: {
        uid: uuid.v4(),
      },
      req_params: {
        speaker: options.voice_type,
        audio_params: {
          format: options.encoding,
          sample_rate: 24000,
          enable_timestamp: true,
        },
        additions: JSON.stringify({
          disable_markdown_filter: false,
        }),
      },
    }

    const sentences = options.text
      .split('。')
      .filter((s: string) => s.trim().length > 0)

    let audioReceived = false

    for (let i = 0; i < sentences.length; i++) {
      const sessionId = uuid.v4()

      await StartSession(
        ws,
        new TextEncoder().encode(
          JSON.stringify({
            ...requestTemplate,
            event: EventType.StartSession,
          }),
        ),
        sessionId,
      )

      console.log(
        `${await WaitForEvent(
          ws,
          MsgType.FullServerResponse,
          EventType.SessionStarted,
        ).then((msg) => msg.toString())}`,
      )

      for (const char of sentences[i]) {
        await TaskRequest(
          ws,
          new TextEncoder().encode(
            JSON.stringify({
              ...requestTemplate,
              req_params: {
                ...requestTemplate.req_params,
                text: char,
              },
              event: EventType.TaskRequest,
            }),
          ),
          sessionId,
        )
      }

      await FinishSession(ws, sessionId)

      const audio: Uint8Array[] = []
      while (true) {
        const msg = await ReceiveMessage(ws)
        console.log(`${msg.toString()}`)

        switch (msg.type) {
          case MsgType.FullServerResponse:
            break
          case MsgType.AudioOnlyServer:
            if (!audioReceived && audio.length > 0) {
              audioReceived = true
            }
            audio.push(msg.payload)
            break
          default:
            throw new Error(`${msg.toString()}`)
        }
        if (msg.event === EventType.SessionFinished) {
          break
        }
      }

      if (audio.length > 0) {
        const outputFile = `${options.voice_type}_session_${i}.${options.encoding}`
        await fs.promises.writeFile(outputFile, audio)
        console.log(`audio saved to ${outputFile}`)
      }
    }

    await FinishConnection(ws)

    console.log(
      `${await WaitForEvent(
        ws,
        MsgType.FullServerResponse,
        EventType.ConnectionFinished,
      ).then((msg) => msg.toString())}`,
    )

    if (!audioReceived) {
      throw new Error('no audio received')
    }

    ws.close()
  })

program.parse()
