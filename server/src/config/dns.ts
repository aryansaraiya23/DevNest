import dns from 'node:dns';

/**
 * Node.js on Windows with c-ares 1.34.6 (shipped in Node 24.14.x and similar)
 * can report only `127.0.0.1` / `::1` as DNS servers even when the OS resolver
 * works. That breaks mongodb+srv SRV lookups with `querySrv ECONNREFUSED`.
 *
 * See: https://github.com/nodejs/node/issues/62748
 * Fixed upstream in Node >= 24.19.0 (c-ares >= 1.34.7).
 *
 * Only override when resolvers are exclusively loopback — do not replace a
 * working system DNS configuration.
 */
export function ensureUsableDnsResolvers(): void {
  const servers = dns.getServers();
  const onlyLoopback =
    servers.length > 0 &&
    servers.every((server) => {
      const host = server.replace(/%.*$/, '');
      return host === '127.0.0.1' || host === '::1';
    });

  if (!onlyLoopback) {
    return;
  }

  dns.setServers(['1.1.1.1', '8.8.8.8']);
  console.warn(
    '[DNS] Node reported loopback-only DNS resolvers (known Windows/c-ares issue). ' +
      'Falling back to public DNS for SRV lookups. Prefer upgrading Node.js to >= 24.19.0.'
  );
}
