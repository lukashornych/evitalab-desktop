import { ConnectionId } from '../model/ConnectionId'
import { Connection } from '../model/Connection'
import { List } from 'immutable'
import { AppConfig } from '../../config/model/AppConfig'
import { EventEmitter } from 'events'

/**
 * Gets emitted when a connection was activated.
 */
export const CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION = 'connectionActivation'
/**
 * Gets emitted when the connection list was changed.
 */
export const CONNECTION_MANAGER_EMIT_CONNECTIONS_CHANGE = 'connectionChange'

/**
 * Manages all evitaDB server connections. This is the main part of the desktop wrapper.
 */
export class ConnectionManager extends EventEmitter {

    private readonly appConfig: AppConfig

    private _connections: Map<ConnectionId, Connection> = new Map()
    private _activeConnection: ConnectionId | undefined = undefined

    constructor(appConfig: AppConfig) {
        super()
        this.appConfig = appConfig
    }

    init(): void {
        if (!this.appConfig.connections.isEmpty()) {
            this._connections = new Map(
                this.appConfig.connections
                    .map(connectionConfig => {
                        return [
                            connectionConfig.id,
                            new Connection(connectionConfig.id, connectionConfig.name, connectionConfig.serverUrl, connectionConfig.driverVersion)
                        ] as [ConnectionId, Connection]
                    })
                    .toArray()
            )
            this.notifyConnectionsChange()
        }
        if (this.appConfig.activeConnection != undefined) {
            this._activeConnection = this.appConfig.activeConnection
            this.notifyConnectionActivated()
        }
    }

    get activeConnection(): Connection | undefined {
        if (this._activeConnection == undefined) {
            return undefined
        }
        return this._connections.get(this._activeConnection)
    }

    get connections(): List<Connection> {
        return List(Array.from(this._connections.values()))
    }

    async activateConnection(connectionId: ConnectionId | undefined): Promise<void> {
        if (connectionId != undefined && !this._connections.has(connectionId)) {
            throw new Error(`Cannot activate connection ${connectionId}, it doesn't exist.`)
        }
        this._activeConnection = connectionId

        await this.updateActiveConnectionConfig()
        this.notifyConnectionActivated()
    }

    async addConnection(connection: Connection): Promise<void> {
        if (this._connections.has(connection.id)) {
            throw new Error(`Connection ${connection.id} already exists.`);
        }
        this._connections.set(connection.id, connection);

        await this.updateConnectionsConfig()
        this.notifyConnectionsChange()
    }

    async removeConnection(connectionId: ConnectionId): Promise<void> {
        if (this._activeConnection === connectionId) {
            this._activeConnection = undefined
        }
        this._connections.delete(connectionId);

        await this.updateActiveConnectionConfig()
        await this.updateConnectionsConfig()
        this.notifyConnectionsChange()
    }

    private updateActiveConnectionConfig(): Promise<void> {
        return this.appConfig.updateActiveConnection(this._activeConnection)
    }

    private updateConnectionsConfig(): Promise<void> {
        return this.appConfig.updateConnections(
            this.connections.map(connection => {
                return {
                    id: connection.id,
                    name: connection.name,
                    serverUrl: connection.serverUrl,
                    driverVersion: connection.driverVersion
                }
            })
        )
    }

    private notifyConnectionActivated(): void {
        const activatedConnection: Connection | undefined = this.activeConnection
        this.emit(CONNECTION_MANAGER_EMIT_CONNECTION_ACTIVATION, activatedConnection)
    }

    private notifyConnectionsChange(): void {
        const connections: Connection[] = this.connections.toArray()
        this.emit(CONNECTION_MANAGER_EMIT_CONNECTIONS_CHANGE, connections)
    }
}
