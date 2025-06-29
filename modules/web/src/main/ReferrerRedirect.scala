package lila.web

import io.mola.galimatias.URL

import scala.util.Try

import lila.core.config.BaseUrl

final class ReferrerRedirect(baseUrl: BaseUrl):

  private val sillyLoginReferrersSet   = Set("/login", "/signup", "/mobile")
  private val loginPattern             = """/\w\w/(login|signup|mobile)""".r.pattern
  def sillyLoginReferrers(ref: String) = sillyLoginReferrersSet(ref) || loginPattern.matcher(ref).matches

  private lazy val parsedBaseUrl = URL.parse(baseUrl.value)

  private val validCharsRegex = """^[\w-\.:/\?&=@#%\[\]\+~]+$""".r

  // allow relative and absolute redirects only to the same domain or
  // subdomains, excluding /mobile (which is shown after logout)
  def valid(referrer: String): Option[String] =
    (!sillyLoginReferrers(referrer) && validCharsRegex.matches(referrer)).so(
      Try {
        URL.parse(parsedBaseUrl, referrer)
      }.toOption
        .filter: url =>
          (url.scheme == parsedBaseUrl.scheme) && url.host == parsedBaseUrl.host
        .map(_.toString)
    )
