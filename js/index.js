const API_KEY = '8c73efe1a5f16f9905ab3fb18a9f7bf7'

const getCampaignsById = (id) =>
  `https://api.dashamail.ru/?method=campaigns.get&api_key=${API_KEY}&format=json&campaign_id=${id}`

const getCampaignsByDateRange = (from, to) =>
  `https://api.dashamail.ru/?method=campaigns.get&api_key=${API_KEY}&format=json&start=${from}&end=${to}`

const getCampaigns = () =>
  `https://api.dashamail.ru/?method=campaigns.get&api_key=${API_KEY}`

const reportsByCampaignId = (id) =>
  `https://api.dashamail.ru/?method=reports.delivered&api_key=${API_KEY}&campaign_id=${id}`

const getMembersByListId = (id) =>
  `https://api.dashamail.ru/?method=lists.get_members&api_key=${API_KEY}&list_id=${id}`

const errorContainer = document.getElementById('error')
const errorIdContainer = document.getElementById('error-id')

const setError = () => {
  errorContainer.style.visibility = 'visible'
}
const hideError = () => {
  errorContainer.style.visibility = 'hidden'
}

const setErrorId = () => {
  errorIdContainer.style.visibility = 'visible'
}
const hideErrorId = () => {
  errorIdContainer.style.visibility = 'hidden'
}

const createTableByIdButton = document.getElementById('createTableByIdButton')
const createTableByDateButton = document.getElementById(
  'createTableByDateButton',
)

if (createTableByIdButton) {
  createTableByIdButton.onclick = async () => {
    try {
      hideError()
      hideErrorId()
      createTableByIdButton.disabled = true

      const campaign_id = document.getElementById('campaign_id').value

      const campaign = (
        await (await fetch(getCampaignsById(campaign_id))).json()
      ).response.data[0]

      const list_id = campaign['list_id']
        .match(/:\d+;/g)
        .pop()
        .substring(1, campaign['list_id'].match(/:\d+;/g).pop().length - 1)

      const mails = (
        await (await fetch(reportsByCampaignId(campaign_id))).json()
      ).response.data

      const members = (await (await fetch(getMembersByListId(list_id))).json())
        .response.data

      const data = mails.map((mail) => {
        const generated = {}

        const member = members.find((m) => m.id === mail.member_id)

        let status = 'delivered'

        if (mail.open_time !== '0000-00-00 00:00:00') {
          status = 'opened'
        }
        if (mail.click_time !== '0000-00-00 00:00:00') {
          status = 'clicked'
        }
        generated['Дата отправки'] = mail.sent_time || ''
        generated['Статус'] = status || ''
        generated['Email'] = mail.email || ''
        generated['Время прочтения'] = mail.open_time || '0000-00-00 00:00:00'

        if (member) {
         // generated['Дополнительное поле'] = member['merge_1'] || ''
          generated['Название рассылки'] = member['merge_2'] || ''
          generated['Дата мероприятия'] = member['merge_3'] || ''
          generated['Ф.И.О'] = member['merge_4'] || ''
          generated['Специализация'] = member['merge_5'] || ''
          generated['Округ'] = member['merge_6'] || ''
          generated['Город'] = member['merge_7'] || ''
          generated['Дополнительное поле'] = member['merge_8'] || ''
        } else {
         // generated['Дополнительное поле'] = ''
          generated['Название рассылки'] = ''
          generated['Дата мероприятия'] = ''
          generated['Ф.И.О'] = ''
          generated['Специализация'] = ''
          generated['Округ'] = ''
          generated['Город'] = ''
          generated['Дополнительное поле'] = ''
        }

        generated['utm_campaign'] = campaign['id']
        generated['utm_source'] = campaign['analytics_source']
        generated['utm_medium'] = campaign['analytics_medium']
        generated['utm_content'] = campaign['analytics_content']

        return generated
      })

      const width = []

      for (let [key, value] of Object.entries(data[0])) {
        let biggest = 0
        data.forEach((elem) => {
          if (elem[key] && elem[key].length + 5 > biggest)
            biggest = elem[key].length + 5
        })
        width.push({width: biggest})
      }
      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = width

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Отчёт по рассылкам')
      XLSX.writeFile(wb, 'Отчёт.xlsx')

      createTableByIdButton.disabled = false
    } catch (error) {
      createTableByIdButton.disabled = false
      setErrorId()
    }
  }
}

if (createTableByDateButton) {
  createTableByDateButton.onclick = async () => {
    try {
      hideError()
      hideErrorId()

      createTableByDateButton.disabled = true

      let end = document.getElementById('end').value
      let start = document.getElementById('start').value

      const startDay = start.substring(0, 2)
      const startMouth = start.substring(3, 5)
      const startYear = start.substring(6, 10)

      const endDay = end.substring(0, 2)
      const endMouth = end.substring(3, 5)
      const endYear = end.substring(6, 10)

      start = `${startYear}-${startMouth}-${startDay} 14:01:32`
      end = `${endYear}-${endMouth}-${endDay} 14:01:32`

      const data = []
      const campaigns = (
        await (await fetch(getCampaignsByDateRange(start, end))).json()
      ).response.data

      for (const campaign of campaigns) {
        const list_id = campaign['list_id']
          .match(/:\d+;/g)
          .pop()
          .substring(1, campaign['list_id'].match(/:\d+;/g).pop().length - 1)

        const mails = (
          await (await fetch(reportsByCampaignId(campaign.id))).json()
        ).response.data

        const members = (
          await (await fetch(getMembersByListId(list_id))).json()
        ).response.data

        mails.forEach((mail) => {
          const generated = {}

          const member = members.find((m) => m.id === mail.member_id)
          let status = 'delivered'

          if (mail.open_time !== '0000-00-00 00:00:00') {
            status = 'opened'
          }
          if (mail.click_time !== '0000-00-00 00:00:00') {
            status = 'clicked'
          }

          generated['Дата отправки'] = mail.sent_time || ''
          generated['Статус'] = status || ''
          generated['Email'] = mail.email || ''
          generated['Время прочтения'] = mail.open_time || '0000-00-00 00:00:00'

          if (member) {
            //generated['Дополнительное поле'] = member['merge_1'] || ''
            generated['Название рассылки'] = member['merge_2'] || ''
            generated['Дата мероприятия'] = member['merge_3'] || ''
            generated['Ф.И.О'] = member['merge_4'] || ''
            generated['Специализация'] = member['merge_5'] || ''
            generated['Округ'] = member['merge_6'] || ''
            generated['Город'] = member['merge_7'] || ''
            generated['Дополнительное поле'] = member['merge_8'] || ''
          } else {
            //generated['Дополнительное поле'] = ''
            generated['Название рассылки'] = ''
            generated['Дата мероприятия'] = ''
            generated['Ф.И.О'] = ''
            generated['Специализация'] = ''
            generated['Округ'] = ''
            generated['Город'] = ''
            generated['Дополнительное поле'] = ''
          }

          generated['utm_campaign'] = campaign['id']
          generated['utm_source'] = campaign['analytics_source']
          generated['utm_medium'] = campaign['analytics_medium']
          generated['utm_content'] = campaign['analytics_content']

          data.push(generated)
        })
      }

      const width = []

      for (let [key, value] of Object.entries(data[0])) {
        let biggest = 0
        data.forEach((elem) => {
          if (elem[key] && elem[key].length + 5 > biggest)
            biggest = elem[key].length + 5
        })
        width.push({width: biggest})
      }
      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = width

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Отчёт по рассылкам')
      XLSX.writeFile(wb, 'Отчёт.xlsx')

      createTableByDateButton.disabled = false
    } catch (error) {
      setError()
      createTableByDateButton.disabled = false
    }
  }
  const clearInputIdButton = document.createElement('button')
  clearInputIdButton.innerHTML = 'Очистить'
  clearInputIdButton.id = 'clearInputId'

  const clearInputDateButton = document.createElement('button')
  clearInputDateButton.innerHTML = 'Очистить'
  clearInputDateButton.id = 'clearInputDate'

  document.querySelector('.wrap').appendChild(clearInputIdButton)
  document.querySelectorAll('.wrap')[1].appendChild(clearInputDateButton)

  document.getElementById('clearInputId').onclick = () => {
    document.getElementById('campaign_id').value = ''
  }

  document.getElementById('clearInputDate').onclick = () => {
    document.getElementById('start').value = ''
    document.getElementById('end').value = ''
  }
}
