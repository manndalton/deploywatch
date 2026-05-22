import { renderAnnotationsPanel, createAnnotationsPanel } from './annotationsPanel';
import { AnnotationMap } from '../history/annotations';

function makeBox() {
  let content = '';
  return {
    setContent: (c: string) => { content = c; },
    getContent: () => content,
    screen: { render: jest.fn() },
  } as any;
}

const MAP: AnnotationMap = {
  'entry-1': [
    {
      entryId: 'entry-1',
      note: 'Deployed hotfix',
      createdAt: '2024-03-01T12:00:00Z',
      author: 'alice',
    },
    {
      entryId: 'entry-1',
      note: 'Rolled back',
      createdAt: '2024-03-02T08:30:00Z',
      author: 'bob',
    },
  ],
};

describe('renderAnnotationsPanel', () => {
  it('shows placeholder when no annotations exist', () => {
    const box = makeBox();
    renderAnnotationsPanel(box, 'no-such-entry', MAP);
    expect(box.getContent()).toContain('No annotations');
  });

  it('renders annotations sorted newest first', () => {
    const box = makeBox();
    renderAnnotationsPanel(box, 'entry-1', MAP);
    const content = box.getContent();
    const rolledIdx = content.indexOf('Rolled back');
    const hotfixIdx = content.indexOf('Deployed hotfix');
    expect(rolledIdx).toBeLessThan(hotfixIdx);
  });

  it('includes author in output', () => {
    const box = makeBox();
    renderAnnotationsPanel(box, 'entry-1', MAP);
    expect(box.getContent()).toContain('alice');
    expect(box.getContent()).toContain('bob');
  });

  it('calls screen.render', () => {
    const box = makeBox();
    renderAnnotationsPanel(box, 'entry-1', MAP);
    expect(box.screen.render).toHaveBeenCalled();
  });

  it('handles empty annotation map gracefully', () => {
    const box = makeBox();
    expect(() => renderAnnotationsPanel(box, 'entry-1', {})).not.toThrow();
  });
});
