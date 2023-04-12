const API_KEY = '8c73efe1a5f16f9905ab3fb18a9f7bf7'
const getCampaignsById = (id) =>
  `https://api.dashamail.ru/?method=campaigns.get&api_key=${API_KEY}&format=json&campaign_id=${id}&limit=1000000`
const getCampaignsByDateRange = (from, to) =>
  `https://api.dashamail.ru/?method=campaigns.get&api_key=${API_KEY}&format=json&start=${from}&end=${to}&limit=1000000`
const getCampaigns = () =>
  `https://api.dashamail.ru/?method=campaigns.get&api_key=${API_KEY}&limit=1000000`
const reportsByCampaignId = (id) =>
  `https://api.dashamail.ru/?method=reports.sent&api_key=${API_KEY}&campaign_id=${id}&limit=1000000`
const reportsUnsubscribedByCampaignId = (id) =>
  `https://api.dashamail.ru/?method=reports.unsubscribed&api_key=${API_KEY}&campaign_id=${id}&limit=1000000&time_start`
const reportsBouncedByCampaignId = (id) =>
  `https://api.dashamail.ru/?method=reports.bounced&api_key=${API_KEY}&campaign_id=${id}&limit=1000000&time_start`
const getMembersByListId = (id) =>
  `https://api.dashamail.ru/?method=lists.get_members&api_key=${API_KEY}&list_id=${id}&limit=1000000`

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
const createTableByDateButton = document.getElementById('createTableByDateButton')
const preloader = document.getElementById('preloader')

if (createTableByIdButton) {
  createTableByIdButton.onclick = async () => {
    try {
      preloader.classList.remove('disabled')
      hideError()
      hideErrorId()
      createTableByIdButton.disabled = true

      const campaign_id = document.getElementById('campaign_id').value

      const campaign = (await (await fetch(getCampaignsById(campaign_id))).json()).response.data[0]

      const list_id = campaign['list_id']
        .match(/:\d+;/g)
        .pop()
        .substring(1, campaign['list_id'].match(/:\d+;/g).pop().length - 1)

      const mails = (await (await fetch(reportsByCampaignId(campaign_id))).json()).response.data

      const mailsUnsubscribed = (await (await fetch(reportsUnsubscribedByCampaignId(campaign_id))).json()).response.data

      const mailsBounced = (await (await fetch(reportsBouncedByCampaignId(campaign_id))).json()).response.data

      const members = (await (await fetch(getMembersByListId(list_id))).json()).response.data

      let data = mails.map((mail) => {
        const generatedID = {}

        const member = members.find((m) => m.email === mail.email)
        const mailUnsubscribed = mailsUnsubscribed.find((m) => m.email === mail.email)
        const mailBounced = mailsBounced.find((m) => m.email === mail.email)

        let status = 'sent'
        if (mail.sent_time !== '0000-00-00 00:00:00') {
          status = 'delivered'
        }
        if (mail.open_time !== '0000-00-00 00:00:00') {
          status = 'opened'
        }
        if (mail.click_time !== '0000-00-00 00:00:00') {
          status = 'clicked'
        }
        if (mailUnsubscribed) status = 'unsubscribed'
        if (mailBounced) status = 'bounced'

        generatedID['Дата отправки'] = mail.sent_time || ''
        generatedID['Статус'] = status || ''
        generatedID['Email'] = mail.email || ''
        generatedID['Время прочтения'] = mail.open_time || '0000-00-00 00:00:00'

        if (member) {
          generatedID['Доп_поле1'] = member ['merge_1'] || ''
          generatedID['Доп_поле2'] = member['merge_6'] || ''
          generatedID['Доп_поле3'] = member['merge_4'] || ''
          generatedID['Доп_поле4'] = member['merge_5'] || ''
          generatedID['Доп_поле5'] = member['merge_3'] || ''
          generatedID['Доп_поле6'] = member['merge_2'] || ''
          generatedID['Доп_поле7'] = member['merge_7'] || ''
          generatedID['Доп_поле8'] = member['merge_8'] || ''
        } else {
          generatedID['Доп_поле1'] = ''
          generatedID['Доп_поле2'] = ''
          generatedID['Доп_поле3'] = ''
          generatedID['Доп_поле4'] = ''
          generatedID['Доп_поле5'] = ''
          generatedID['Доп_поле6'] = ''
          generatedID['Доп_поле7'] = ''
          generatedID['Доп_поле8'] = ''
        }

        generatedID['utm_campaign'] = campaign['analytics_tag']
        generatedID['utm_source'] = campaign['analytics_source']
        generatedID['utm_medium'] = campaign['analytics_medium']
        generatedID['utm_content'] = campaign['analytics_content']

        return generatedID
      })

      const widthID = []

      for (let [key, value] of Object.entries(data[0])) {
        let biggest = 0
        data.forEach((elem) => {
          if (elem[key] && elem[key].length + 5 > biggest)
            biggest = elem[key].length + 5
        })
        widthID.push({width: biggest})
      }
      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = widthID

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Отчёт по ID')
      XLSX.writeFile(wb, 'Отчёт по ID.xlsx')

      createTableByIdButton.disabled = false
      preloader.classList.add('disabled')
    } catch (error) {
      createTableByIdButton.disabled = false
      preloader.classList.add('disabled')

      setErrorId()
    }
  }
}

if (createTableByDateButton) {
  createTableByDateButton.onclick = async () => {
    try {
      preloader.classList.remove('disabled')
      hideError()
      hideErrorId()
      createTableByDateButton.disabled = true


      let start = document.getElementById('start').value
      let end = document.getElementById('end').value

      const startDay = start.substring(0, 2)
      const startMouth = start.substring(3, 5)
      const startYear = start.substring(6, 10)

      const endDay = end.substring(0, 2)
      const endMouth = end.substring(3, 5)
      const endYear = end.substring(6, 10)

      let newEndDay = parseInt(endDay) + 1;

      start = `${startYear}-${startMouth}-${startDay}`
      end = `${endYear}-${endMouth}-${newEndDay}`

      const data = []
      const campaigns = (
        await (await fetch(getCampaignsByDateRange(start, end))).json()
      ).response.data

      for (const campaign of campaigns) {
        const list_id = campaign['list_id']
          .match(/:\d+;/g)
          .pop()
          .substring(1, campaign['list_id'].match(/:\d+;/g).pop().length - 1)

        const mails = (await (await fetch(reportsByCampaignId(campaign.id))).json()).response.data
        let mailsUnsubscribed = (await (await fetch(reportsUnsubscribedByCampaignId(campaign.id))).json()).response.data
        const mailsBounced = (await (await fetch(reportsBouncedByCampaignId(campaign.id))).json()).response.data
        const members = (await (await fetch(getMembersByListId(list_id))).json()).response.data

        mails.forEach((mail) => {
          const generatedDate = {}

          const member = members.find((m) => m.email === mail.email)
          const mailUnsubscribed = mailsUnsubscribed.find((m) => m.email === mail.email,)
          let mailBounced = mailsBounced.find((m) => m.email === mail.email)

          let status = 'sent'
          if (mail.sent_time !== '0000-00-00 00:00:00') {
            status = 'delivered'
          }
          if (mail.open_time !== '0000-00-00 00:00:00') {
            status = 'opened'
          }
          if (mail.click_time !== '0000-00-00 00:00:00') {
            status = 'clicked'
          }
          if (mailUnsubscribed) status = 'unsubscribed'
          if (mailBounced) status = 'bounced'

          generatedDate['Дата отправки'] = mail.sent_time || ''
          generatedDate['Статус'] = status || ''
          generatedDate['Email'] = mail.email || ''
          generatedDate['Время прочтения'] = mail.open_time || '0000-00-00 00:00:00'

          if (member) {
            generatedDate['Доп_поле1'] = member ['merge_1'] || ''
            generatedDate['Доп_поле2'] = member['merge_6'] || ''
            generatedDate['Доп_поле3'] = member['merge_4'] || ''
            generatedDate['Доп_поле4'] = member['merge_5'] || ''
            generatedDate['Доп_поле5'] = member['merge_3'] || ''
            generatedDate['Доп_поле6'] = member['merge_2'] || ''
            generatedDate['Доп_поле7'] = member['merge_7'] || ''
            generatedDate['Доп_поле8'] = member['merge_8'] || ''
          } else {
            generatedDate['Доп_поле1'] = ''
            generatedDate['Доп_поле2'] = ''
            generatedDate['Доп_поле3'] = ''
            generatedDate['Доп_поле4'] = ''
            generatedDate['Доп_поле5'] = ''
            generatedDate['Доп_поле6'] = ''
            generatedDate['Доп_поле7'] = ''
            generatedDate['Доп_поле8'] = ''
          }

          generatedDate['utm_campaign'] = campaign['analytics_tag']
          generatedDate['utm_source'] = campaign['analytics_source']
          generatedDate['utm_medium'] = campaign['analytics_medium']
          generatedDate['utm_content'] = campaign['analytics_content']

          data.push(generatedDate)
        })
      }

      const widthDate = []

      for (let [key, value] of Object.entries(data[0])) {
        let biggest = 0
        data.forEach((elem) => {
          if (elem[key] && elem[key].length + 5 > biggest)
            biggest = elem[key].length + 5
        })
        widthDate.push({width: biggest})
      }
      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = widthDate

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Отчёт по дате')
      XLSX.writeFile(wb, 'Отчёт по дате.xlsx')

      preloader.classList.add('disabled')
      createTableByDateButton.disabled = false
    } catch (error) {
      setError()
      preloader.classList.add('disabled')
      createTableByDateButton.disabled = false
    }
  }

  const clearInputIdButton = document.createElement('button');
  clearInputIdButton.innerHTML = 'Очистить';
  clearInputIdButton.id = 'clearInputId';

  const clearInputDateButton = document.createElement('button');
  clearInputDateButton.innerHTML = 'Очистить';
  clearInputDateButton.id = 'clearInputDate';

  document.querySelector('.wrap').appendChild(clearInputIdButton);
  document.querySelectorAll('.wrap')[1].appendChild(clearInputDateButton);

  const handleClearInputId = () => {
    document.getElementById('campaign_id').value = '';
  };

  const handleClearInputDate = () => {
    document.getElementById('start').value = '';
    document.getElementById('end').value = '';
  };

  document.getElementById('clearInputId').addEventListener('click', (event) => {
    event.preventDefault();
    handleClearInputId();
  });

  document.getElementById('clearInputDate').addEventListener('click', (event) => {
    event.preventDefault();
    handleClearInputDate();
  });
}

