import * as factory from './support/factory';
import rewire from 'rewire';
import * as F from 'fkit';

const World = rewire('../src/world');

const core  = World.__get__('core');

// Stub each call to the `rollDice` function with the return values in the
// list of `xss`.
const stubRollDice = F.variadic((sandbox, xss) => {
  let stub = sandbox.stub(core, 'rollDice');
  xss.map((xs, i) => { stub.onCall(i).returns(xs); });
});

function find(as, bs) {
  return bs.map((q) => {
    return F.find(comparator(q), as);
  });

  function comparator(p) {
    return F.compose(F.eq(p.id), F.get('id'));
  }
}

function move(world, a, b) {
  let result = world.move(a, b);
  return find(result.countries, [a, b]);
}

function attack(world, a, b) {
  let result = world.attack(a, b);
  return find(result.countries, [a, b]);
}

function reinforce(world, player) {
  let result = world.reinforce(player);
  return find(result.countries, world.countriesOccupiedBy(player));
}

describe('World', () => {
  let sandbox, x, y, z;

  // Player stubs.
  let p = {}, q = {};

  // Country stubs.
  let p1 = factory.buildCountry(1, p, 4, 4),
      p2 = factory.buildCountry(2, p, 2, 3),
      p3 = factory.buildCountry(3, p, 1, 2),
      q1 = factory.buildCountry(4, q, 2, 2);

  let world = factory.buildWorld([p1, p2, p3, q1]);

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#move', () => {
    beforeEach(() => {
      [x, y] = move(world, p1, q1);
    });

    it('should move to the target country', () => {
      expect(x.player).to.equal(p);
      expect(y.player).to.equal(p);
    });

    it('should distribute the armies', () => {
      expect(x.armies).to.equal(2);
      expect(y.armies).to.equal(2);
    });
  });

  describe('#attack', () => {
    context('when the attacker rolls higher than the defender', () => {
      beforeEach(() => {
        stubRollDice(sandbox, [6, 4, 2, 1], [6, 5]);
        [x, y] = attack(world, p1, q1);
      });

      it('should move the attacker to target country', () => {
        expect(x.player).to.equal(p);
        expect(y.player).to.equal(p);
      });

      it('should update the armies', () => {
        expect(x.armies).to.equal(2);
        expect(y.armies).to.equal(1);
      });
    });

    context('when the attacker rolls equal to the defender', () => {
      beforeEach(() => {
        stubRollDice(sandbox, [5, 1, 1, 1], [6, 4]);
        [x, y] = attack(world, p1, q1);
      });

      it('should not move the attacker', () => {
        expect(x.player).to.equal(p);
        expect(y.player).to.equal(q);
      });

      it('should update the armies', () => {
        expect(x.armies).to.equal(2);
        expect(y.armies).to.equal(2);
      });
    });

    context('when the attacker rolls lower than the defender', () => {
      beforeEach(() => {
        stubRollDice(sandbox, [5, 2, 1, 1], [6, 4]);
        [x, y] = attack(world, p1, q1);
      });

      it('should not move the attacker', () => {
        expect(x.player).to.equal(p);
        expect(y.player).to.equal(q);
      });

      it('should update the armies', () => {
        expect(x.armies).to.equal(2);
        expect(y.armies).to.equal(2);
      });
    });
  });

  describe('#reinforce', () => {
    beforeEach(() => {
      sandbox.stub(core, 'distribute').returns([0, 1, 1]);
      sandbox.stub(world.graph, 'connectedComponents').returns([['a'], ['b', 'c']]);
      sandbox.stub(world.graph, 'shortestPathBy').returns(['a', 'b', 'c']);
      [x, y, z] = reinforce(world, p);
    });

    it('should reinforce the countries', () => {
      expect(x.armies).to.equal(4);
      expect(y.armies).to.equal(3);
      expect(z.armies).to.equal(2);
    });
  });
});
