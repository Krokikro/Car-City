import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { integrationsForForm } from "@/lib/admin/integrations";
import { connectHookAction, hookUrl, notifyTestAction, saveIntegrationAction, testIntegrationAction } from "../actions-integrations";

export const dynamic = "force-dynamic";
export const metadata = { title: "Интеграции" };

function Status({ on, ok, text }: { on: boolean; ok: boolean; text?: string }) {
  return <em className={`st ${on && ok ? "st-issued" : on ? "st-new" : "st-hidden"}`}>{text ?? (on && ok ? "Включено" : on ? "Не настроено до конца" : "Выключено")}</em>;
}
function Btns({ kind, write, hook, notify }: { kind: string; write: boolean; hook?: boolean; notify?: boolean }) {
  if (!write) return null;
  return (
    <div className="pnl-int-btns">
      <button className="pnl-btn pnl-btn-main" type="submit">Сохранить</button>
      <button className="pnl-btn" formAction={testIntegrationAction} formNoValidate>Проверить</button>
      {hook && <button className="pnl-btn" formAction={connectHookAction} formNoValidate>Подключить приём сообщений</button>}
      {notify && <button className="pnl-btn" formAction={notifyTestAction} formNoValidate>Пробное уведомление</button>}
    </div>
  );
}

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "integrations" });
  const write = can(user, "integrations", "write");
  const v = await integrationsForForm();
  const [tg, mx, wz] = await Promise.all([hookUrl("telegram"), hookUrl("max"), hookUrl("wazzup")]);
  const secret = (val: string, ph: string) => ({ placeholder: val ? `${val} — оставьте пустым, чтобы не менять` : ph, defaultValue: "" });

  return (
    <Shell user={user} active="integrations" title="Интеграции" sub="Куда уходят заявки и откуда приходят сообщения клиентов. Ключи хранятся зашифрованными и не показываются целиком." flash={sp}>
      <div className="pnl-int">
        <form id="bitrix" action={saveIntegrationAction} className="pnl-card pnl-form pnl-int-card">
          <input type="hidden" name="kind" value="bitrix" />
          <header><span className="pnl-int-logo b24">Б24</span><div><h2>Битрикс24</h2><p className="pnl-muted">Каждая заявка и каждый чат создают лид в CRM; переписка из чатов попадает в ленту лида.</p></div><Status on={v.bitrix.on} ok={Boolean(v.bitrix.webhook)} /></header>
          <fieldset disabled={!write} className="pnl-plain">
            <label className="pnl-check"><input type="checkbox" name="on" defaultChecked={v.bitrix.on} /> Включить</label>
            <label>Входящий вебхук<input name="webhook" {...secret(v.bitrix.webhook, "https://ваш-портал.bitrix24.ru/rest/1/abcdef123456/")} maxLength={300} autoComplete="off" /><small>Битрикс24 → Разработчикам → Другое → Входящий вебхук, права: CRM. «-» — удалить сохранённый.</small></label>
            <div className="pnl-row2">
              <label>Источник лида (SOURCE_ID)<input name="sourceId" defaultValue={v.bitrix.sourceId} maxLength={40} /><small>Код источника в CRM, по умолчанию WEB</small></label>
              <label className="pnl-check"><input type="checkbox" name="leads" defaultChecked={v.bitrix.leads} /> Создавать лиды из заявок и чатов</label>
            </div>
          </fieldset>
          <Btns kind="bitrix" write={write} />
        </form>

        <form id="telegram" action={saveIntegrationAction} className="pnl-card pnl-form pnl-int-card">
          <input type="hidden" name="kind" value="telegram" />
          <header><span className="pnl-int-logo tg">TG</span><div><h2>Telegram</h2><p className="pnl-muted">Уведомления менеджерам о заявках и сообщениях; клиенты пишут боту — переписка идёт в «Чаты».</p></div><Status on={v.telegram.on} ok={Boolean(v.telegram.token)} text={v.telegram.on && v.telegram.token ? (v.telegram.username ? `@${v.telegram.username}` : "Включено") : undefined} /></header>
          <fieldset disabled={!write} className="pnl-plain">
            <label className="pnl-check"><input type="checkbox" name="on" defaultChecked={v.telegram.on} /> Включить</label>
            <label>Токен бота<input name="token" {...secret(v.telegram.token, "123456789:AA…")} maxLength={100} autoComplete="off" /><small>Создайте бота у @BotFather и вставьте токен. «-» — удалить сохранённый.</small></label>
            <div className="pnl-row2">
              <label>Куда слать уведомления<input name="notify" defaultValue={v.telegram.notify} placeholder="-1001234567890" maxLength={300} /><small>ID чатов или групп через запятую; бота нужно добавить в группу</small></label>
              <label>Тема в группе (необязательно)<input name="thread" defaultValue={v.telegram.thread} inputMode="numeric" maxLength={12} /><small>Номер темы, если в группе включены темы</small></label>
            </div>
            <label className="pnl-check"><input type="checkbox" name="chats" defaultChecked={v.telegram.chats} /> Принимать сообщения клиентов в «Чаты»</label>
            <p className="pnl-int-hook"><span>Адрес для входящих:</span> <code>{tg.replace(/[^/]+$/, "•••")}</code></p>
          </fieldset>
          <Btns kind="telegram" write={write} hook notify />
        </form>

        <form id="max" action={saveIntegrationAction} className="pnl-card pnl-form pnl-int-card">
          <input type="hidden" name="kind" value="max" />
          <header><span className="pnl-int-logo mx">MAX</span><div><h2>MAX</h2><p className="pnl-muted">Бот в мессенджере MAX: уведомления менеджерам и переписка с клиентами в «Чатах».</p></div><Status on={v.max.on} ok={Boolean(v.max.token)} text={v.max.on && v.max.token && v.max.username ? `@${v.max.username}` : undefined} /></header>
          <fieldset disabled={!write} className="pnl-plain">
            <label className="pnl-check"><input type="checkbox" name="on" defaultChecked={v.max.on} /> Включить</label>
            <label>Токен бота<input name="token" {...secret(v.max.token, "токен из кабинета MAX для партнёров")} maxLength={200} autoComplete="off" /><small>business.max.ru → Чат-боты → ваш бот → Токен. «-» — удалить сохранённый.</small></label>
            <label>Куда слать уведомления<input name="notify" defaultValue={v.max.notify} placeholder="ID чатов через запятую" maxLength={300} /><small>Бот должен быть участником чата</small></label>
            <label className="pnl-check"><input type="checkbox" name="chats" defaultChecked={v.max.chats} /> Принимать сообщения клиентов в «Чаты»</label>
            <p className="pnl-int-hook"><span>Адрес для входящих:</span> <code>{mx.replace(/[^/]+$/, "•••")}</code></p>
          </fieldset>
          <Btns kind="max" write={write} hook notify />
        </form>

        <form id="wazzup" action={saveIntegrationAction} className="pnl-card pnl-form pnl-int-card">
          <input type="hidden" name="kind" value="wazzup" />
          <header><span className="pnl-int-logo wa">WA</span><div><h2>WhatsApp через Wazzup</h2><p className="pnl-muted">Сообщения клиентов в WhatsApp приходят в «Чаты», ответы менеджера уходят в WhatsApp.</p></div><Status on={v.wazzup.on} ok={Boolean(v.wazzup.apiKey && v.wazzup.channelId)} /></header>
          <fieldset disabled={!write} className="pnl-plain">
            <label className="pnl-check"><input type="checkbox" name="on" defaultChecked={v.wazzup.on} /> Включить</label>
            <label>API-ключ Wazzup<input name="apiKey" {...secret(v.wazzup.apiKey, "ключ из кабинета Wazzup")} maxLength={100} autoComplete="off" /><small>Wazzup → Настройки → Интеграции → API. «-» — удалить сохранённый.</small></label>
            <div className="pnl-row2">
              <label>ID канала WhatsApp<input name="channelId" defaultValue={v.wazzup.channelId} placeholder="нажмите «Проверить» — покажем список" maxLength={40} /></label>
              <label>Номер WhatsApp компании<input name="phone" defaultValue={v.wazzup.phone} placeholder="+7 …" maxLength={20} /><small>Для справки менеджерам</small></label>
            </div>
            <label className="pnl-check"><input type="checkbox" name="chats" defaultChecked={v.wazzup.chats} /> Принимать сообщения клиентов в «Чаты»</label>
            <p className="pnl-int-hook"><span>Адрес для входящих:</span> <code>{wz.replace(/[^/]+$/, "•••")}</code></p>
          </fieldset>
          <Btns kind="wazzup" write={write} hook />
        </form>

        <form id="webhook" action={saveIntegrationAction} className="pnl-card pnl-form pnl-int-card">
          <input type="hidden" name="kind" value="webhook" />
          <header><span className="pnl-int-logo wh">{"{ }"}</span><div><h2>Свой вебхук</h2><p className="pnl-muted">Каждая заявка уходит JSON-запросом на ваш адрес, с подписью HMAC-SHA256 в заголовке X-Signature.</p></div><Status on={v.webhook.on} ok={Boolean(v.webhook.url)} /></header>
          <fieldset disabled={!write} className="pnl-plain">
            <label className="pnl-check"><input type="checkbox" name="on" defaultChecked={v.webhook.on} /> Включить</label>
            <div className="pnl-row2">
              <label>Адрес<input name="url" defaultValue={v.webhook.url} placeholder="https://…" maxLength={500} /></label>
              <label>Секрет подписи<input name="secret" {...secret(v.webhook.secret, "необязательно")} maxLength={200} autoComplete="off" /></label>
            </div>
          </fieldset>
          <Btns kind="webhook" write={write} />
        </form>

        <section className="pnl-card pnl-int-help">
          <h2>Как подключить мессенджеры</h2>
          <ol className="pnl-steps">
            <li>Вставьте токен (или ключ Wazzup) и нажмите «Сохранить», затем «Проверить» — покажем имя бота или список каналов.</li>
            <li>Нажмите «Подключить приём сообщений»: мессенджер начнёт присылать сообщения клиентов в раздел «Чаты».</li>
            <li>Для уведомлений менеджерам укажите ID чата или группы и нажмите «Пробное уведомление».</li>
            <li>После переезда на car-city.pro нажмите «Подключить приём сообщений» ещё раз — адрес вебхука сменится на новый домен.</li>
          </ol>
        </section>
      </div>
    </Shell>
  );
}
