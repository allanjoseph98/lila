package lila.shutup

import akka.actor.*
import com.softwaremill.macwire.*
import play.api.Configuration

import lila.core.config.*

@Module
final class Env(
    appConfig: Configuration,
    relationApi: lila.core.relation.RelationApi,
    reportApi: lila.core.report.ReportApi,
    gameRepo: lila.core.game.GameRepo,
    userApi: lila.core.user.UserApi,
    db: lila.db.Db
)(using Executor):

  private val coll = db(CollName("shutup"))

  val api = wire[ShutupApi]
