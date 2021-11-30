import { matchBasename, getPathSnippets } from '../src/basenames'

describe('basename', () => {
  it('should work well. matchBasename', () => {
    expect(matchBasename('/', '/')).toBeTruthy()
    expect(matchBasename('/', '/foo')).toBeTruthy()
    expect(matchBasename('/', '/test')).toBeTruthy()
    expect(matchBasename('/foo', '/foo')).toBeTruthy()
    expect(matchBasename('/foo', '/foobar')).toBeFalsy()
    expect(matchBasename('/foo', '/')).toBeFalsy()
    expect(matchBasename('/foo', '/test')).toBeFalsy()
  })

  it('should work well. getPathSnippets', () => {
    expect(getPathSnippets('/')).toMatchObject([])
    expect(getPathSnippets('//')).toMatchObject([])
    expect(getPathSnippets('///')).toMatchObject([])

    expect(getPathSnippets('/foo')).toMatchObject(['foo'])
    expect(getPathSnippets('//foo')).toMatchObject(['foo'])
    expect(getPathSnippets('foo')).toMatchObject(['foo'])
    expect(getPathSnippets('foo/')).toMatchObject(['foo'])
    expect(getPathSnippets('foo//')).toMatchObject(['foo'])

    expect(getPathSnippets('/foo/bar')).toMatchObject(['foo', 'bar'])
    expect(getPathSnippets('foo/bar')).toMatchObject(['foo', 'bar'])
    expect(getPathSnippets('foo//bar')).toMatchObject(['foo', 'bar'])
    expect(getPathSnippets('foo///bar')).toMatchObject(['foo', 'bar'])

    expect(getPathSnippets('/foobar')).toMatchObject(['foobar'])
    expect(getPathSnippets('/foobar/')).toMatchObject(['foobar'])
    expect(getPathSnippets('foobar')).toMatchObject(['foobar'])
  })
})
