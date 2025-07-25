package lila.security

import scalalib.Iso
import scalatags.Text.all.*

import lila.core.config.*
import lila.core.i18n.I18nKey.emails as trans
import lila.mailer.Mailer
import lila.user.{ Me, User, UserRepo }

final class EmailChange(
    userRepo: UserRepo,
    mailer: Mailer,
    baseUrl: BaseUrl,
    tokenerSecret: Secret
)(using Executor, lila.core.i18n.Translator):

  import Mailer.html.*

  def send(user: User, email: EmailAddress): Funit =
    email.looksLikeFakeEmail.not.so:
      tokener.make(TokenPayload(user.id, email)).flatMap { token =>
        lila.mon.email.send.change.increment()
        given play.api.i18n.Lang = user.realLang | lila.core.i18n.defaultLang
        val url = s"$baseUrl/account/email/confirm/$token"
        lila.log("auth").info(s"Change email URL ${user.username} $email $url")
        mailer.sendOrFail:
          Mailer.Message(
            to = email,
            subject = trans.emailChange_subject.txt(user.username),
            text = Mailer.txt.addServiceNote(s"""
${trans.emailChange_intro.txt()}
${trans.emailChange_click.txt()}

$url

${trans.common_orPaste.txt()}
"""),
            htmlBody = emailMessage(
              pDesc(trans.emailChange_intro()),
              p(trans.emailChange_click()),
              potentialAction(metaName("Change email address"), Mailer.html.url(url)),
              serviceNote
            ).some
          )
      }

  // also returns the previous email address
  def confirm(token: String): Fu[Option[(Me, Option[EmailAddress])]] =
    tokener.read(token).flatMapz { case TokenPayload(userId, email) =>
      for
        previous <- userRepo.email(userId)
        _ <- userRepo.setEmail(userId, email).recoverDefault
        me <- userRepo.me(userId)
      yield
        logger.info(s"Change email for $userId: ${previous | "none"} -> $email")
        me.map(_ -> previous)
    }

  case class TokenPayload(userId: UserId, email: EmailAddress)

  private given Iso.StringIso[TokenPayload] with
    private val sep = ' '
    val from = str =>
      str
        .split(sep)
        .match
          case Array(id, email) => EmailAddress.from(email).map { TokenPayload(UserId(id), _) }
          case _ => none
        .err("Invalid token payload")
    val to = a => s"${a.userId}$sep${a.email}"

  private val tokener = StringToken.withLifetimeAndFutureValue[TokenPayload](
    secret = tokenerSecret,
    lifetime = 10.minutes,
    getCurrentValue = t => userRepo.email(t.userId).dmap(_.fold("none")(_.value))
  )
